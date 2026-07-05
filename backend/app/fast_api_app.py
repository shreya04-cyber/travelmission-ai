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
import asyncio
import json
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
from sqlalchemy import text
from sqlalchemy.orm import Session
from starlette.middleware.base import BaseHTTPMiddleware

from app import models
from app.agent import root_agent
from app.app_utils.telemetry import setup_telemetry
from app.app_utils.typing import Feedback
from app.database import Base, SessionLocal, engine, get_db
from app.mcp.currency_service import GlobalCurrencyService
from app.schemas import trip
from app.skills.travel_skills import (
    BudgetCalculationSkill,
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

# Execute safe column migrations for SQLite compatibility
with engine.connect() as conn:
    for col, col_type in [
        ("health_score", "INTEGER DEFAULT 100"),
        ("active_alerts", "TEXT DEFAULT '[]'"),
        ("recommendations", "TEXT DEFAULT '[]'"),
        ("smart_notifications", "TEXT DEFAULT '[]'"),
    ]:
        try:
            conn.execute(text(f"ALTER TABLE trips ADD COLUMN {col} {col_type}"))
            conn.commit()
        except Exception:
            pass  # column already exists

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
    trip_id: int,
    destination: str,
    start_date: str,
    end_date: str,
    budget_total: float,
    dest_currency: str,
    home_currency: str,
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
        session_id = f"session_trip_{trip_id}"
        prompt = f"Plan a trip to {destination} from {start_date} to {end_date} with a budget of {budget_total} USD."
        state = {
            "trip_id": str(trip_id),
            "destination": destination,
            "start_date": start_date,
            "end_date": end_date,
            "budget_total": budget_total,
        }

        # Explicitly create the session to avoid "Session not found" runtime exceptions
        await runner.session_service.create_session(
            app_name="app",
            user_id="user_default",
            session_id=session_id,
            state=state,
        )

        # Run agent and broadcast events
        async for _event in runner.run_async(
            user_id="user_default",
            session_id=session_id,
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

        # 6. Safety & Etiquette & Transport & Currency Resolution
        _safety_res = SafetyLookupSkill.execute(destination)
        guide_res = LocalEtiquetteSkill.execute(destination)
        _transport_res = LocalTransportSkill.execute(destination)

        # Resolve live rates from destination currency to home currency
        rate_dest_to_home = GlobalCurrencyService.get_rate(dest_currency, home_currency)

        # Log currency rate resolution to activity feed
        rate_act = models.AgentActivity(
            trip_id=trip_id,
            agent_name="Currency Agent",
            activity_type="Result",
            message=f"Global Currency Intelligence: Resolved 1 {dest_currency} = {rate_dest_to_home:.4f} {home_currency}. Payment advice: Zero-fee credit card recommended.",
        )
        db.add(rate_act)
        db.commit()
        await manager.broadcast(
            trip_id,
            {"type": "Result", "agent": "Currency Agent", "message": rate_act.message},
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
                cost_home_currency=round(cost * rate_dest_to_home, 2),
                actual_cost=0.0,
                notes=f"Estimated in {dest_currency} by Budget Agent. Converted to {home_currency}.",
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

                cost_dest = 15.0
                item = models.ItineraryItem(
                    trip_id=trip_id,
                    day_number=day,
                    time_of_day=tod,
                    title=title,
                    description="Curated schedule item by Activity Planner. Estimated cost is nominal.",
                    location=destination,
                    cost=cost_dest,
                    cost_home_currency=round(cost_dest * rate_dest_to_home, 2),
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
        home_currency=trip_in.home_currency,
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
        db_trip.currency,
        db_trip.home_currency,
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


@app.post("/api/trips/{trip_id}/simulate")
async def simulate_agent_collaboration(
    trip_id: int, scenario: str, db: Session = Depends(get_db)
):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    try:
        alerts = json.loads(trip.active_alerts or "[]")
    except Exception:
        alerts = []
    try:
        recommendations = json.loads(trip.recommendations or "[]")
    except Exception:
        recommendations = []
    try:
        notifications = json.loads(trip.smart_notifications or "[]")
    except Exception:
        notifications = []

    logs = []

    if scenario == "flight_price_drop":
        logs = [
            (
                "Flight Agent",
                "Thought",
                "Scanning flight grid... Detected price drop on direct SFO-HND route from $950 to $870.",
            ),
            (
                "Budget Agent",
                "Thought",
                "Price drop detected. Recalculating Flight budget allocation. Saving $80.",
            ),
            (
                "Orchestrator",
                "Result",
                "Re-budgeting complete. Notification dispatched to traveler.",
            ),
        ]
        flight_log = (
            db.query(models.BudgetLog)
            .filter(
                models.BudgetLog.trip_id == trip_id,
                models.BudgetLog.category == "Flight",
            )
            .first()
        )
        if flight_log:
            flight_log.estimated_cost = max(100.0, flight_log.estimated_cost - 80)
            db.add(flight_log)
        notifications.append("Your flight is now $80 cheaper.")
        recommendations.append("Rebook flight via SFO direct route to save $80.")
        trip.health_score = min(100, (trip.health_score or 100) + 5)

    elif scenario == "heavy_rain":
        logs = [
            (
                "Weather Agent",
                "Thought",
                "High-altitude cloud grid scan shows heavy rain alert on Day 2 in Shibuya.",
            ),
            (
                "Activity Planner",
                "Thought",
                "Rain forecast received. Re-scheduling Shibuya Crossing stroll to TeamLab Planets digital art museum.",
            ),
            (
                "Packing Agent",
                "Thought",
                "Adjusting packing recommendations: umbrella and water-resistant gear added to list.",
            ),
            (
                "Hotel Agent",
                "Thought",
                "Suggesting indoor attractions near Shibuya Horizon Hotel: Shibuya Indoor Mall & Shibuya Sky.",
            ),
            (
                "Orchestrator",
                "Result",
                "Mission agenda updated. Timeline shuffles compiled successfully.",
            ),
        ]
        itinerary_items = (
            db.query(models.ItineraryItem)
            .filter(models.ItineraryItem.trip_id == trip_id)
            .all()
        )
        for item in itinerary_items:
            if (
                "shibuya" in item.title.lower()
                or "garden" in item.title.lower()
                or "park" in item.title.lower()
            ):
                item.title = "Indoor Museum Visit (Weather Shifted)"
                item.weather_notes = "Rain forecast detected. Shifted from outdoor activities to keep travelers dry."
                db.add(item)
        notifications.append("Tomorrow's weather changed. Outdoor plans were moved.")
        alerts.append("Day 2 heavy rain warning. Shifted to indoor alternatives.")
        recommendations.append("Carry an umbrella and use indoor subway links.")

    elif scenario == "flight_delay":
        logs = [
            (
                "Flight Agent",
                "Thought",
                "Flight SFO-HND delayed by 3 hours due to air traffic control congestion.",
            ),
            (
                "Transportation Agent",
                "Thought",
                "Flight delay received. Adjusting airport transfer shuttle check-in time from 10:00 AM to 1:00 PM.",
            ),
            (
                "Hotel Agent",
                "Thought",
                "Updating hotel check-in time: Late check-in request sent and confirmed at Shibuya Horizon Hotel.",
            ),
            (
                "Activity Planner",
                "Thought",
                "Shifting Day 1 morning schedule. Shifting arrival tour to afternoon.",
            ),
            (
                "Budget Agent",
                "Thought",
                "Delay audit complete. Recalculating transit surcharge ($15 fee added for late-night shuttle change).",
            ),
            (
                "Orchestrator",
                "Result",
                "All schedules adjusted. Notifications dispatched to traveler.",
            ),
        ]
        arrival_item = (
            db.query(models.ItineraryItem)
            .filter(
                models.ItineraryItem.trip_id == trip_id,
                models.ItineraryItem.day_number == 1,
            )
            .first()
        )
        if arrival_item:
            arrival_item.title = "Arrival & Late Check-in (Delayed)"
            arrival_item.description = "Flight delayed by 3 hours. Take airport transfer directly to Shibuya Horizon Hotel."
            db.add(arrival_item)
        transit_log = (
            db.query(models.BudgetLog)
            .filter(
                models.BudgetLog.trip_id == trip_id,
                models.BudgetLog.category == "Transportation",
            )
            .first()
        )
        if transit_log:
            transit_log.estimated_cost += 15
            db.add(transit_log)
        notifications.append(
            "Your flight is delayed by 3 hours. Transit and check-in times shifted."
        )
        alerts.append("Flight delay alert: Departure delayed by 3 hours.")

    elif scenario == "passport_issue":
        logs = [
            (
                "Visa Agent",
                "Thought",
                "Reviewing uploaded passport document. Passport expiry date is within 3 months of trip end date.",
            ),
            (
                "Visa Agent",
                "Result",
                "Passport validity problem: Expiration date is less than 3 months. Visa entry validation failed.",
            ),
            (
                "Orchestrator",
                "Thought",
                "Critical security alert. Reducing Trip Health Score. Demoting status to action required.",
            ),
            (
                "Orchestrator",
                "Result",
                "Emergency checklist generated. Dispatching critical alert.",
            ),
        ]
        trip.health_score = 35
        notifications.append(
            "Urgent: Passport expires too soon. Visa validation failed."
        )
        alerts.append("Critical: Passport validity is less than 3 months.")
        recommendations.append(
            "Renew passport immediately. Book emergency passport renewal slot."
        )

    elif scenario == "overspending":
        logs = [
            (
                "Budget Agent",
                "Thought",
                "Auditing total expenditures. Estimated spending exceeds total budget allocation by $250.",
            ),
            (
                "Local Guide Agent",
                "Thought",
                "Budget cap exceeded. Shifting dining suggestions: recommending budget-friendly local izakayas.",
            ),
            (
                "Budget Agent",
                "Result",
                "Daily spending limit reduced. Restaurant suggestions updated.",
            ),
            (
                "Orchestrator",
                "Result",
                "Financial constraints propagated. Dashboard budget markers updated.",
            ),
        ]
        budget_logs = (
            db.query(models.BudgetLog).filter(models.BudgetLog.trip_id == trip_id).all()
        )
        for blog in budget_logs:
            if blog.category in ["Food", "Shopping"]:
                blog.notes = "Cap reduced by Budget Agent due to overspending. Recommended low-cost local options."
                db.add(blog)
        notifications.append("Budget exceeded. Suggesting cheaper restaurants.")
        alerts.append("Total cost exceeds budget allocation limit.")
        recommendations.append(
            "Reduce shopping allowance and choose local transit over taxis."
        )
        trip.health_score = max(50, (trip.health_score or 100) - 20)

    elif scenario == "unsafe_weather":
        logs = [
            (
                "Safety Agent",
                "Thought",
                "Severe storm warning issued for Shibuya region.",
            ),
            (
                "Weather Agent",
                "Thought",
                "Confirming storm front active. Wind speeds exceeding 50 knots forecast.",
            ),
            (
                "Local Guide Agent",
                "Thought",
                "Advising traveler safety: avoid high towers, suggest indoor Shibuya underground passages.",
            ),
            (
                "Orchestrator",
                "Result",
                "Emergency contacts highlighted on dashboard: Shibuya Police (+81-3-3416-0110).",
            ),
        ]
        notifications.append("Severe weather alert: Shibuya storm warning active.")
        alerts.append("Severe storm warning: Shibuya region.")
        recommendations.append(
            "Stay indoors. Emergency contacts highlighted on dashboard."
        )
        trip.health_score = max(40, (trip.health_score or 100) - 25)

    elif scenario == "currency_fluctuation":
        logs = [
            (
                "Currency Agent",
                "Thought",
                "Exchange rate monitor: Dest currency JPY weakened by 2.4% against USD today.",
            ),
            (
                "Budget Agent",
                "Thought",
                "Favorable exchange rate detected. Saving potential: exchange funds today to lock in rate.",
            ),
            ("Orchestrator", "Result", "Dispatched money exchange recommendation."),
        ]
        notifications.append("Favorable exchange rate detected. Exchange money now.")
        recommendations.append("Exchange money today to lock in JPY favorable rate.")

    else:
        raise HTTPException(status_code=400, detail="Invalid scenario name")

    trip.active_alerts = json.dumps(alerts)
    trip.recommendations = json.dumps(recommendations)
    trip.smart_notifications = json.dumps(notifications)
    db.add(trip)
    db.commit()

    for agent, act_type, msg in logs:
        db_act = models.AgentActivity(
            trip_id=trip_id, agent_name=agent, activity_type=act_type, message=msg
        )
        db.add(db_act)
        db.commit()
        await manager.broadcast(
            trip_id, {"type": act_type, "agent": agent, "message": msg}
        )
        await asyncio.sleep(0.3)

    db.refresh(trip)
    # Broadcast final trip details updated event
    await manager.broadcast(
        trip_id,
        {
            "type": "Result",
            "agent": "Orchestrator",
            "message": "Trip details synchronized successfully.",
        },
    )
    return trip


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


# --- Currency Intelligence Endpoint ---
@app.get("/api/currency/rates")
def get_currency_rates(from_currency: str = "USD", to_currency: str = "EUR"):
    try:
        rate = GlobalCurrencyService.get_rate(from_currency, to_currency)
        advice = GlobalCurrencyService.get_payment_advice(to_currency)
        trends = GlobalCurrencyService.get_historical_trends(from_currency, to_currency)
        return {
            "status": "success",
            "rate": rate,
            "advice": advice,
            "trends": trends,
            "supported_currencies": GlobalCurrencyService.get_supported_currencies(),
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch currency rates: {e!s}"
        ) from e


# --- General Feedback Endpoint ---
@app.post("/feedback")
def collect_feedback(feedback: Feedback) -> dict[str, str]:
    if logger:
        logger.log_struct(feedback.model_dump(), severity="INFO")
    return {"status": "success"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
