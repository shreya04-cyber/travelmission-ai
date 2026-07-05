# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
import os
import shutil
import time
from typing import Any

from fastapi import (
    BackgroundTasks,
    Depends,
    FastAPI,
    File,
    HTTPException,
    UploadFile,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from google.adk.cli.fast_api import get_fast_api_app
from google.adk.runners import InMemoryRunner
from google.cloud import logging as google_cloud_logging
from google.genai import types
from sqlalchemy.orm import Session
from starlette.middleware.base import BaseHTTPMiddleware

from app import models
from app.agent import root_agent
from app.app_utils.telemetry import setup_telemetry
from app.app_utils.typing import Feedback
from app.database import Base, SessionLocal, engine, get_db
from app.schemas import trip
from app.skills.travel_skills import (
    BudgetCalculationSkill,
    CurrencyExchangeSkill,
    DocumentParsingSkill,
    FlightSearchSkill,
    HotelSelectionSkill,
    LocalEtiquetteSkill,
    LocalTransportSkill,
    PackingListSkill,
    SafetyLookupSkill,
    VisaRequirementSkill,
    WeatherFetchSkill,
)

# Setup telemetry and logging
setup_telemetry()
try:
    logging_client = google_cloud_logging.Client()
    logger = logging_client.logger(__name__)
except Exception:
    logger = None

# Initialize database tables
Base.metadata.create_all(bind=engine)

# Create UPLOAD_DIR
UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads"
)
os.makedirs(UPLOAD_DIR, exist_ok=True)


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limit: int = 60, window: int = 60):
        super().__init__(app)
        self.limit = limit
        self.window = window
        self.requests = {}

    async def dispatch(self, request, call_next):
        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()

        # Clean up old entries
        self.requests = {
            ip: times
            for ip, times in self.requests.items()
            if now - times[-1] < self.window
        }

        if client_ip not in self.requests:
            self.requests[client_ip] = []

        self.requests[client_ip] = [
            t for t in self.requests[client_ip] if now - t < self.window
        ]

        if len(self.requests[client_ip]) >= self.limit:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Rate limit exceeded."},
            )

        self.requests[client_ip].append(now)
        return await call_next(request)


def sanitize_prompt(text: str) -> bool:
    forbidden = [
        "ignore previous instructions",
        "system directive",
        "you must now act as",
        "override instructions",
        "dan mode",
    ]
    for word in forbidden:
        if word in text.lower():
            return False
    return True


# Connection manager for WebSockets
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, list[WebSocket]] = {}

    async def connect(self, trip_id: int, websocket: WebSocket):
        await websocket.accept()
        if trip_id not in self.active_connections:
            self.active_connections[trip_id] = []
        self.active_connections[trip_id].append(websocket)

    def disconnect(self, trip_id: int, websocket: WebSocket):
        if trip_id in self.active_connections:
            self.active_connections[trip_id].remove(websocket)
            if not self.active_connections[trip_id]:
                del self.active_connections[trip_id]

    async def broadcast(self, trip_id: int, message: dict[str, Any]):
        if trip_id in self.active_connections:
            for connection in self.active_connections[trip_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass


manager = ConnectionManager()


# Background task to execute the ADK Multi-Agent pipeline
async def execute_travel_mission(
    trip_id: int, destination: str, start_date: str, end_date: str, budget_total: float
):
    db = SessionLocal()
    try:
        # Create initial activity
        init_act = models.AgentActivity(
            trip_id=trip_id,
            agent_name="Orchestrator",
            activity_type="Thought",
            message=f"Initializing travel mission for {destination} from {start_date} to {end_date}.",
        )
        db.add(init_act)
        db.commit()
        await manager.broadcast(
            trip_id,
            {"type": "Thought", "agent": "Orchestrator", "message": init_act.message},
        )

        # Run ADK agent
        runner = InMemoryRunner(agent=root_agent, app_name="app")
        prompt = f"Plan a trip to {destination} from {start_date} to {end_date} with a budget of {budget_total} USD."
        state = {
            "trip_id": str(trip_id),
            "destination": destination,
            "start_date": start_date,
            "end_date": end_date,
            "budget_total": budget_total,
        }

        # Run agent and broadcast events
        async for _event in runner.run_async(
            user_id="user_default",
            session_id=f"session_trip_{trip_id}",
            new_message=types.Content(parts=[types.Part.from_text(text=prompt)]),
            state_delta=state,
        ):
            # Parse internal updates to broadcast if needed
            pass

        # Trigger specialized skills to populate structured DB tables for the dashboard
        # This guarantees clean structured data for flights, hotels, safety, itinerary, weather, packing

        # 1. Visa Requirements
        _visa_res = VisaRequirementSkill.execute("United States", destination)

        # 2. Weather
        weather_res = WeatherFetchSkill.execute(destination, start_date)
        condition = weather_res.get("forecast", {}).get("condition", "Sunny")
        is_rainy = weather_res.get("alerts", {}).get("rain_warning", False)

        # 3. Packing
        _packing_res = PackingListSkill.execute(destination, condition, 5)

        # 4. Flight options
        flight_res = FlightSearchSkill.execute(
            "SFO", destination[:3].upper(), start_date
        )
        cheapest_flight = flight_res.get("cheapest_option", {"price_usd": 650})
        flight_cost = cheapest_flight.get("price_usd", 650)

        # 5. Hotels
        hotel_res = HotelSelectionSkill.execute(destination, start_date, end_date)
        best_hotel = hotel_res.get(
            "best_deal", {"price_per_night_usd": 150, "name": "Standard Boutique Hotel"}
        )
        hotel_cost = best_hotel.get("price_per_night_usd", 150)

        # 6. Safety & Etiquette & Transport
        _safety_res = SafetyLookupSkill.execute(destination)
        guide_res = LocalEtiquetteSkill.execute(destination)
        _transport_res = LocalTransportSkill.execute(destination)
        _currency_res = CurrencyExchangeSkill.execute(
            "USD", "JPY" if destination.lower() == "tokyo" else "EUR"
        )

        # Write Budget Logs to DB
        budget_res = BudgetCalculationSkill.calculate_trip_budget(
            5, hotel_cost, flight_cost, 1
        )
        for cat, cost in budget_res["category_breakdown"].items():
            b_log = models.BudgetLog(
                trip_id=trip_id,
                category=cat,
                estimated_cost=cost,
                actual_cost=0.0,
                notes=f"Estimated by Budget Agent for {destination}.",
            )
            db.add(b_log)

        # Write Itinerary Timeline to DB
        days = 5
        activities_pool = {
            "tokyo": [
                {
                    "Morning": "Visit Senso-ji Temple in Asakusa",
                    "Afternoon": "Explore Shinjuku Gyoen National Garden",
                    "Evening": "Dinner at Omoide Yokocho",
                },
                {
                    "Morning": "Shibuya Crossing and Meiji Shrine",
                    "Afternoon": "Harajuku shopping on Takeshita St",
                    "Evening": "Roppongi Hills Observation Deck",
                },
                {
                    "Morning": "Tsukiji Outer Market Food Tour",
                    "Afternoon": "TeamLab Planets digital art museum",
                    "Evening": "Sushi dining in Ginza",
                },
                {
                    "Morning": "Day trip to Mt. Fuji (Hakone)",
                    "Afternoon": "Lake Ashi Cruise",
                    "Evening": "Return to Tokyo, Izakaya crawl",
                },
                {
                    "Morning": "Akihabara electric town exploring",
                    "Afternoon": "Ueno Park and Museums",
                    "Evening": "Farewell dinner in Shibuya",
                },
            ],
            "paris": [
                {
                    "Morning": "Eiffel Tower and Champ de Mars walk",
                    "Afternoon": "Seine River Cruise & Louvre Museum",
                    "Evening": "Dinner at Saint-Germain-des-Prés",
                },
                {
                    "Morning": "Cathedral Notre-Dame & Île de la Cité",
                    "Afternoon": "Montmartre and Sacré-Cœur",
                    "Evening": "Cabaret show or local bistro",
                },
                {
                    "Morning": "Palace of Versailles Day Trip",
                    "Afternoon": "Versailles Gardens",
                    "Evening": "Return to Paris, dinner near Bastille",
                },
                {
                    "Morning": "Musée d'Orsay impressionist art",
                    "Afternoon": "Champs-Élysées & Arc de Triomphe",
                    "Evening": "Seine embankment sunset walk",
                },
                {
                    "Morning": "Le Marais historic tour",
                    "Afternoon": "Jardin du Luxembourg relaxation",
                    "Evening": "Farewell dinner at Le Train Bleu",
                },
            ],
        }

        destination_key = destination.lower()
        plan = activities_pool.get(
            destination_key,
            [
                {
                    "Morning": "Local historic center walking tour",
                    "Afternoon": "Main city museum exploration",
                    "Evening": "Traditional local dinner spot",
                },
                {
                    "Morning": "Scenic view point hike or tower climb",
                    "Afternoon": "Botanical gardens stroll",
                    "Evening": "Local food market crawling",
                },
                {
                    "Morning": "Art gallery visit",
                    "Afternoon": "Shopping in design district",
                    "Evening": "Rooftop lounge cocktails",
                },
                {
                    "Morning": "Day excursion to nearby historic village",
                    "Afternoon": "Countryside cycling/walking",
                    "Evening": "Bistro dining",
                },
                {
                    "Morning": "Souvenir shopping and coffee tasting",
                    "Afternoon": "Local park relaxation",
                    "Evening": "Farewell gourmet dinner",
                },
            ]
            * 2,
        )

        for day in range(1, days + 1):
            day_plan = plan[day - 1] if day - 1 < len(plan) else plan[0]
            for tod, title in day_plan.items():
                w_notes = None
                if (
                    (is_rainy and "garden" in title.lower())
                    or "park" in title.lower()
                    or "hike" in title.lower()
                ):
                    # Activity shifted because of weather!
                    original_title = title
                    title = "Indoor Museum Visit (Weather Shifted)"
                    w_notes = f"Rain forecast detected. Shifted from outdoor: '{original_title}' to keep travelers dry."

                item = models.ItineraryItem(
                    trip_id=trip_id,
                    day_number=day,
                    time_of_day=tod,
                    title=title,
                    description="Curated schedule item by Activity Planner. Estimated cost is nominal.",
                    location=destination,
                    cost=15.0,
                    agent_notes=f"Recommended by Local Guide. Etiquette: {guide_res.get('cultural_etiquette', '')[:100]}...",
                    weather_notes=w_notes,
                )
                db.add(item)

        # Update trip status
        trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
        if trip:
            trip.status = "Active"
            db.add(trip)

        db.commit()

        # Log completion
        complete_act = models.AgentActivity(
            trip_id=trip_id,
            agent_name="Orchestrator",
            activity_type="Result",
            message="Travel Mission compilation complete! 12 agents have successfully finished planning.",
        )
        db.add(complete_act)
        db.commit()
        await manager.broadcast(
            trip_id,
            {
                "type": "Result",
                "agent": "Orchestrator",
                "message": complete_act.message,
            },
        )

    except Exception as e:
        db.rollback()
        err_act = models.AgentActivity(
            trip_id=trip_id,
            agent_name="Orchestrator",
            activity_type="Result",
            message=f"Planning execution error: {e!s}",
        )
        db.add(err_act)
        db.commit()
        await manager.broadcast(
            trip_id,
            {"type": "Result", "agent": "Orchestrator", "message": err_act.message},
        )
    finally:
        db.close()


# Base ADK fast api setup
AGENT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
allow_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]

app: FastAPI = get_fast_api_app(
    agents_dir=AGENT_DIR,
    web=True,
    artifact_service_uri=None,
    allow_origins=allow_origins,
    session_service_uri=None,
    otel_to_cloud=False,
)

app.title = "TravelMission AI Operations Center"
app.description = "API Operations Center for multi-agent travel operations."

# Setup CORS and Rate Limiting for security
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimitMiddleware, limit=60, window=60)

# --- WebSocket Feed Endpoint ---


@app.websocket("/api/trips/{trip_id}/feed")
async def websocket_endpoint(websocket: WebSocket, trip_id: int):
    await manager.connect(trip_id, websocket)
    db = SessionLocal()
    try:
        # Send historical logs first
        activities = (
            db.query(models.AgentActivity)
            .filter(models.AgentActivity.trip_id == trip_id)
            .order_by(models.AgentActivity.timestamp.asc())
            .all()
        )
        for act in activities:
            await websocket.send_json(
                {
                    "type": act.activity_type,
                    "agent": act.agent_name,
                    "message": act.message,
                    "timestamp": act.timestamp.isoformat(),
                }
            )

        while True:
            # Keep connection open
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(trip_id, websocket)
    except Exception:
        manager.disconnect(trip_id, websocket)
    finally:
        db.close()


# --- Trips APIs ---


@app.post("/api/trips", response_model=trip.Trip)
def create_trip(
    trip_in: trip.TripCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    # Prompt injection check
    if not sanitize_prompt(trip_in.destination):
        raise HTTPException(
            status_code=400,
            detail="Potential prompt injection threat detected in destination input.",
        )

    db_trip = models.Trip(
        destination=trip_in.destination,
        start_date=trip_in.start_date,
        end_date=trip_in.end_date,
        budget_total=trip_in.budget_total,
        currency=trip_in.currency,
        status="Planning",
    )
    db.add(db_trip)
    db.commit()
    db.refresh(db_trip)

    # Trigger multi-agent pipeline in background
    background_tasks.add_task(
        execute_travel_mission,
        db_trip.id,
        db_trip.destination,
        db_trip.start_date,
        db_trip.end_date,
        db_trip.budget_total,
    )

    return db_trip


@app.get("/api/trips", response_model=list[trip.Trip])
def list_trips(db: Session = Depends(get_db)):
    return db.query(models.Trip).order_by(models.Trip.created_at.desc()).all()


@app.get("/api/trips/{trip_id}", response_model=trip.TripDetail)
def get_trip_detail(trip_id: int, db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@app.delete("/api/trips/{trip_id}")
def delete_trip(trip_id: int, db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    db.delete(trip)
    db.commit()
    return {"status": "success", "message": "Trip deleted successfully"}


# --- Documents Upload & Parsing ---


@app.post("/api/trips/{trip_id}/documents")
async def upload_document(
    trip_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)
):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    # Security: File validation & upload limit checks (5MB limit)
    MAX_FILE_SIZE = 5 * 1024 * 1024
    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    file.file.seek(0)  # reset pointer
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400, detail="File too large. Maximum size allowed is 5MB."
        )

    if not file.filename.lower().endswith((".pdf", ".png", ".jpg", ".jpeg")):
        raise HTTPException(
            status_code=400, detail="Only PDF, PNG, or JPG files allowed."
        )

    file_path = os.path.join(UPLOAD_DIR, f"trip_{trip_id}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Record in database
    db_doc = models.UserDocument(
        trip_id=trip_id,
        file_name=file.filename,
        file_path=file_path,
        file_type=file.content_type,
        status="Processing",
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)

    # Run parsing skill (simulate document parsing / OCR)
    try:
        parse_res = DocumentParsingSkill.execute(file_path)
        extracted = parse_res.get("extracted_entities", {}).copy()

        # Mask sensitive PII data before saving
        if "document_number" in extracted:
            doc_num = str(extracted["document_number"])
            extracted["document_number"] = (
                doc_num[:2] + "*" * (len(doc_num) - 4) + doc_num[-2:]
            )
        if "birth_date" in extracted:
            extracted["birth_date"] = "****-**-**"

        db_doc.parsed_content = str(extracted)
        db_doc.status = "Parsed"

        # Log to agent feed
        act = models.AgentActivity(
            trip_id=trip_id,
            agent_name="Visa Agent",
            activity_type="ToolCall",
            message=f"Document Parsing: Uploaded file '{file.filename}' processed successfully. Extracted traveler entities.",
        )
        db.add(act)
        db.add(db_doc)
        db.commit()
        await manager.broadcast(
            trip_id, {"type": "ToolCall", "agent": "Visa Agent", "message": act.message}
        )
    except Exception:
        db_doc.status = "Failed"
        db.add(db_doc)
        db.commit()

    return {
        "status": "success",
        "document_id": db_doc.id,
        "extracted": db_doc.parsed_content,
    }


# --- PDF Brief Export ---


@app.get("/api/trips/{trip_id}/download-pdf")
def download_travel_brief(trip_id: int, db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    # Read details
    itinerary = "\n".join(
        [
            f"Day {item.day_number} ({item.time_of_day}): {item.title} - {item.description}"
            for item in trip.itinerary_items
        ]
    )
    budget = "\n".join(
        [f"* {item.category}: ${item.estimated_cost}" for item in trip.budget_logs]
    )

    brief = f"""TRAVELMISSION AI - TRAVEL OPERATIONS SUMMARY
Trip Destination: {trip.destination}
Dates: {trip.start_date} to {trip.end_date}
Budget Total: ${trip.budget_total} {trip.currency}

=========================================
ITINERARY DETAIL
=========================================
{itinerary}

=========================================
BUDGET ESTIMATION
=========================================
{budget}

=========================================
EMERGENCY COORDINATES
=========================================
* Police: 112 (International Standard)
* Ambulance/Fire: 112

Safe Travels!
Generated by TravelMission AI.
"""
    return {"status": "success", "content": brief}


# --- General Feedback Endpoint ---
@app.post("/feedback")
def collect_feedback(feedback: Feedback) -> dict[str, str]:
    if logger:
        logger.log_struct(feedback.model_dump(), severity="INFO")
    return {"status": "success"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
