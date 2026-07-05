import os

import google.auth
from google.adk.agents import Agent
from google.adk.apps import App
from google.adk.models import Gemini
from google.genai import types

# Import specialized agents
from app.agents import (
    activity_planner_agent,
    budget_agent,
    currency_agent,
    flight_agent,
    hotel_agent,
    language_agent,
    local_guide_agent,
    packing_agent,
    safety_agent,
    transportation_agent,
    visa_agent,
    weather_agent,
)

# Import database session and model
from app.database import SessionLocal
from app.models import AgentActivity

# Set up GCP environment variables for local testing fallback, making GCP optional
try:
    _, project_id = google.auth.default()
    os.environ["GOOGLE_CLOUD_PROJECT"] = project_id or "travel-mission-capstone"
    os.environ["GOOGLE_CLOUD_LOCATION"] = "global"
    os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "True"
except Exception:
    # Fallback to Google AI Studio if GCP credentials are not present
    os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "False"
    os.environ["GOOGLE_CLOUD_PROJECT"] = "travel-mission-capstone"

# --- Callbacks for Live Activity Feed ---


async def log_before_agent(callback_context) -> None:
    trip_id = callback_context.state.get("trip_id")
    agent_name = (
        callback_context.agent.name
        if hasattr(callback_context, "agent")
        else "Orchestrator"
    )
    msg = f"Agent '{agent_name}' activated. Running reasoning analysis..."

    if trip_id:
        db = SessionLocal()
        try:
            activity = AgentActivity(
                trip_id=int(trip_id),
                agent_name=agent_name,
                activity_type="Thought",
                message=msg,
            )
            db.add(activity)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Error in callback: {e}")
        finally:
            db.close()


async def log_after_agent(callback_context) -> None:
    trip_id = callback_context.state.get("trip_id")
    agent_name = (
        callback_context.agent.name
        if hasattr(callback_context, "agent")
        else "Orchestrator"
    )
    msg = f"Agent '{agent_name}' completed its tasks successfully."

    if trip_id:
        db = SessionLocal()
        try:
            activity = AgentActivity(
                trip_id=int(trip_id),
                agent_name=agent_name,
                activity_type="Result",
                message=msg,
            )
            db.add(activity)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Error in callback: {e}")
        finally:
            db.close()


async def log_before_tool(tool, args: dict, tool_context) -> None:
    trip_id = tool_context.state.get("trip_id")
    agent_name = "Agent Tool"
    msg = f"Executing tool '{tool.name}' with arguments: {args}"

    if trip_id:
        db = SessionLocal()
        try:
            activity = AgentActivity(
                trip_id=int(trip_id),
                agent_name=agent_name,
                activity_type="ToolCall",
                message=msg,
            )
            db.add(activity)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Error in callback: {e}")
        finally:
            db.close()


# Apply callbacks to all specialized agents
agents_list = [
    flight_agent,
    visa_agent,
    hotel_agent,
    budget_agent,
    weather_agent,
    packing_agent,
    safety_agent,
    local_guide_agent,
    activity_planner_agent,
    currency_agent,
    language_agent,
    transportation_agent,
]

for agent in agents_list:
    agent.before_agent_callback = log_before_agent
    agent.after_agent_callback = log_after_agent
    agent.before_tool_callback = log_before_tool

# --- Define Root Orchestrator Agent ---

root_agent = Agent(
    name="orchestrator",
    model=Gemini(
        model="gemini-flash-latest",
        retry_options=types.HttpRetryOptions(attempts=3),
    ),
    instruction="""You are the Lead Travel Orchestrator for TravelMission AI ("Your Personal AI Travel Operations Center").
Your goal is to coordinate a specialized team of 12 travel agents to construct a complete, optimized Travel Mission for the user.

Your specialist team includes:
1. flight_agent: Search airline routes, compare prices, find alternative airports.
2. visa_agent: Verify visa entry requirements, passport validity rules, required checklist documents.
3. hotel_agent: Find accommodations, score them based on local safety and public transit proximity.
4. budget_agent: Audit and summarize the budget in category bins (Hotel, Flights, Food, Transport, Shopping, Insurance, Emergency) and suggest savings tips.
5. weather_agent: Pull destination weather forecasts, temperature grids, and rainfall warnings.
6. packing_agent: Formulate weather-based clothing checklists, adapt adapters, list electronics and medicine kits.
7. safety_agent: Identify local scams, provide national emergency numbers (police, ambulance), register advisories, and women's safety recommendations.
8. local_guide_agent: Curate cultural rules, tipping etiquette, hidden gems, and local dining advice.
9. activity_planner_agent: Organize daily morning, afternoon, and evening timelines, adjusting outdoor events if there are rain warning indicators.
10. currency_agent: Present conversion rates and suggest ATM/credit card cash splits.
11. language_agent: Give emergency phrases and essential greetings with phonetic guides.
12. transportation_agent: Outline airport shuttle trains, metro ticket passes, taxi and walking options.

Orchestration Workflow:
- When a user asks to plan a trip, ALWAYS invoke the sub-agents sequentially to analyze the destination.
- You must prompt them to retrieve relevant details.
- Once they have responded, summarize the final Travel Mission details in a beautiful, structured format.
- Ensure the user's budget and target dates are respected.
- Include a checklist of visa regulations, flights, packing guidelines, local customs, and safety numbers.
- If weather warnings arise, state how activities were shifted.
""",
    sub_agents=agents_list,
    before_agent_callback=log_before_agent,
    after_agent_callback=log_after_agent,
)

# Define the App object
app = App(
    root_agent=root_agent,
    name="app",
)
