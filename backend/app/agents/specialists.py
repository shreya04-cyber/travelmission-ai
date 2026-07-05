from google.adk.agents import Agent
from google.adk.models import Gemini
from google.genai import types

from app.mcp.config import filesystem_mcp
from app.skills.travel_skills import BudgetCalculationSkill

# Import tools
from app.tools.travel_tools import (
    check_visa_requirements_tool,
    get_currency_exchange_rate_tool,
    get_local_guide_tips_tool,
    get_local_transport_options_tool,
    get_packing_suggestions_tool,
    get_safety_advisory_tool,
    get_weather_forecast_tool,
    search_flights_tool,
    search_hotels_tool,
    translate_text_tool,
)


# Use the same model configuration as the scaffolded root agent for consistency
def get_default_model():
    return Gemini(
        model="gemini-flash-latest",
        retry_options=types.HttpRetryOptions(attempts=3),
    )


# 1. Flight Agent
flight_agent = Agent(
    name="flight_agent",
    model=get_default_model(),
    description="Researches flights, compares airlines, estimates baggage, and suggests cheaper dates or alternative airports.",
    instruction="""You are the Flight Agent for TravelMission AI.
Your job is to search for flights, analyze options, recommend airlines, suggest cheaper alternative travel dates or airports, and estimate baggage costs.
Use the search_flights_tool to fetch flight options. Always summarize the best flight options and explain why you recommended them.""",
    tools=[search_flights_tool],
)

# 2. Visa Agent
visa_agent = Agent(
    name="visa_agent",
    model=get_default_model(),
    description="Analyzes visa entry requirements, passport validity rules, embassy coordinates, and tourist checklists.",
    instruction="""You are the Visa Agent for TravelMission AI.
Your job is to verify visa requirements for travelers based on their passport country and destination country.
Check processing times, fees, required passport validity, and documentation checklists.
Use check_visa_requirements_tool. Use the filesystem_mcp tool to inspect the uploaded documents to verify passport expirations.""",
    tools=[check_visa_requirements_tool, filesystem_mcp],
)

# 3. Hotel Agent
hotel_agent = Agent(
    name="hotel_agent",
    model=get_default_model(),
    description="Searches hotels, analyzes safety scores, and optimizes lodging locations based on proximity to transit.",
    instruction="""You are the Hotel Agent for TravelMission AI.
Your job is to research lodging options in the target destination for the check-in and check-out dates.
Ensure you evaluate safety scores, transit proximity, pricing, and amenities.
Use search_hotels_tool. Provide recommendations categorized by budget (budget, moderate, luxury).""",
    tools=[search_hotels_tool],
)


# 4. Budget Agent
# Wrap skill method as a tool function
def calculate_budget_tool(
    duration_days: int, hotel_cost_night: float, flight_cost: float, num_people: int
) -> dict:
    """Calculate the estimated total budget breakdown and suggest savings opportunities.

    Args:
        duration_days: The number of days for the trip.
        hotel_cost_night: The average price per night of selected lodging.
        flight_cost: The price of the round-trip flight per person.
        num_people: The number of travelers.

    Returns:
        A dictionary with budget totals and categories.
    """
    return BudgetCalculationSkill.calculate_trip_budget(
        duration_days, hotel_cost_night, flight_cost, num_people
    )


budget_agent = Agent(
    name="budget_agent",
    model=get_default_model(),
    description="Estimates the total travel budget (flights, hotels, food, transport, insurance, shopping, emergency funds) and suggests savings.",
    instruction="""You are the Budget Agent for TravelMission AI.
Your job is to estimate and audit the total travel budget. You break down costs into Flights, Hotel, Food, Transport, Insurance, Shopping, and Emergency Funds.
Use the calculate_budget_tool. Always recommend savings tips to keep the budget optimized.""",
    tools=[calculate_budget_tool],
)

# 5. Weather Agent
weather_agent = Agent(
    name="weather_agent",
    model=get_default_model(),
    description="Retrieves weather forecasts, temperature ranges, humidity, and warns about rain/snow alerts.",
    instruction="""You are the Weather Agent for TravelMission AI.
Your job is to fetch weather conditions for the destination and travel dates.
Check temperature, humidity, UV index, and flag any rain or storm alerts.
Use get_weather_forecast_tool. Provide packing and activity adjustment advice based on the weather.""",
    tools=[get_weather_forecast_tool],
)

# 6. Packing Agent
packing_agent = Agent(
    name="packing_agent",
    model=get_default_model(),
    description="Generates dynamic packing checklists based on destination weather conditions, trip duration, and medical/electronic necessities.",
    instruction="""You are the Packing Agent for TravelMission AI.
Your job is to compile a packing list tailored to the weather forecast, trip duration, and destination.
Ensure you include essential travel documents, electronics/adapters, and a medical kit.
Use get_packing_suggestions_tool.""",
    tools=[get_packing_suggestions_tool],
)

# 7. Safety Agent
safety_agent = Agent(
    name="safety_agent",
    model=get_default_model(),
    description="Inspects travel advisories, emergency numbers, scam warnings, hospital access, and women's safety guidelines.",
    instruction="""You are the Safety Agent for TravelMission AI.
Your job is to check safety levels, State Department travel advisories, emergency contacts, local scam warnings, and hospital locations.
Use get_safety_advisory_tool. Highlight critical scams to avoid and general emergency procedures.""",
    tools=[get_safety_advisory_tool],
)

# 8. Local Guide Agent
local_guide_agent = Agent(
    name="local_guide_agent",
    model=get_default_model(),
    description="Provides local culture information, etiquette rules, hidden gems, and dining recommendations.",
    instruction="""You are the Local Guide Agent for TravelMission AI.
Your job is to give travelers a taste of local culture, highlight hidden gems away from crowds, explain dining customs, and list local etiquette rules (like tipping or subway behavior).
Use get_local_guide_tips_tool.""",
    tools=[get_local_guide_tips_tool],
)

# 9. Activity Planner Agent
activity_planner_agent = Agent(
    name="activity_planner_agent",
    model=get_default_model(),
    description="Plans and compiles daily itineraries, optimizing routes, travel times, and suggesting tickets/bookings.",
    instruction="""You are the Activity Planner Agent for TravelMission AI.
Your job is to arrange a day-by-day itinerary of activities.
Optimize the route to avoid backtrack travel, suggest booking tickets in advance for popular spots, and adjust schedules to accommodate weather forecasts (e.g. move outdoor activities to indoor museums on rainy days).
State details clearly by morning, afternoon, and evening.""",
    tools=[],
)

# 10. Currency Agent
currency_agent = Agent(
    name="currency_agent",
    model=get_default_model(),
    description="Fetches live currency exchange rates and outlines card vs cash spending strategies.",
    instruction="""You are the Currency Agent for TravelMission AI.
Your job is to check current exchange rates between currencies.
Recommend cash vs card split ratios and advise on the safest ATM networks to avoid rip-off markups.
Use get_currency_exchange_rate_tool.""",
    tools=[get_currency_exchange_rate_tool],
)

# 11. Language Agent
language_agent = Agent(
    name="language_agent",
    model=get_default_model(),
    description="Translates key travel phrases, emergency questions, and provides phonetic pronunciation helpers.",
    instruction="""You are the Language Agent for TravelMission AI.
Your job is to translate common travel questions (greetings, directions, emergency calls) into the destination's primary language.
Provide phonetic pronunciation guides for each phrase so travelers can speak them easily.
Use translate_text_tool.""",
    tools=[translate_text_tool],
)

# 12. Transportation Agent
transportation_agent = Agent(
    name="transportation_agent",
    model=get_default_model(),
    description="Recommends city transit networks, metro passes, airport shuttle routes, and walking pathways.",
    instruction="""You are the Transportation Agent for TravelMission AI.
Your job is to guide travelers on local public transport (subways, trains, buses), airport shuttle paths, and taxi/ridesharing options.
State if the city is walking-friendly.
Use get_local_transport_options_tool.""",
    tools=[get_local_transport_options_tool],
)
