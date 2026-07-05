from typing import Any

from app.tools.travel_tools import (
    check_visa_requirements_tool,
    get_currency_exchange_rate_tool,
    get_local_guide_tips_tool,
    get_local_transport_options_tool,
    get_packing_suggestions_tool,
    get_safety_advisory_tool,
    get_weather_forecast_tool,
    parse_uploaded_document_tool,
    search_flights_tool,
    search_hotels_tool,
    translate_text_tool,
)


class FlightSearchSkill:
    @staticmethod
    def execute(origin: str, destination: str, date: str) -> dict[str, Any]:
        result = search_flights_tool(origin, destination, date)
        # Reusable post-processing logic
        if result["status"] == "success" and result["flights"]:
            # Inject cheap date recommendation
            result["savings_recommendation"] = (
                "Fly mid-week (Tuesday/Wednesday) to save approximately 15-20% on tickets."
            )
        return result


class VisaRequirementSkill:
    @staticmethod
    def execute(passport_country: str, destination_country: str) -> dict[str, Any]:
        return check_visa_requirements_tool(passport_country, destination_country)


class HotelSelectionSkill:
    @staticmethod
    def execute(
        destination: str, checkin_date: str, checkout_date: str
    ) -> dict[str, Any]:
        result = search_hotels_tool(destination, checkin_date, checkout_date)
        if result["status"] == "success":
            # Grade hotels based on combined safety and transportation scores
            for h in result["hotels"]:
                combined_score = (h["safety_score"] + h["transport_score"]) / 2
                h["location_rating"] = (
                    "Excellent"
                    if combined_score >= 90
                    else "Good"
                    if combined_score >= 80
                    else "Standard"
                )
        return result


class WeatherFetchSkill:
    @staticmethod
    def execute(location: str, date: str) -> dict[str, Any]:
        return get_weather_forecast_tool(location, date)


class BudgetCalculationSkill:
    @staticmethod
    def calculate_trip_budget(
        duration_days: int,
        hotel_cost_night: float,
        flight_cost: float,
        num_people: int = 1,
    ) -> dict[str, Any]:
        # Estimate costs based on standard averages
        food_per_day = 50.0
        transport_per_day = 15.0
        shopping_buffer = 150.0
        insurance = 45.0
        emergency_fund = 200.0

        lodging_total = hotel_cost_night * duration_days
        flights_total = flight_cost * num_people
        food_total = food_per_day * duration_days * num_people
        transport_total = transport_per_day * duration_days * num_people

        estimated_total = (
            lodging_total
            + flights_total
            + food_total
            + transport_total
            + shopping_buffer
            + insurance
            + emergency_fund
        )

        categories = {
            "Flight": flights_total,
            "Hotel": lodging_total,
            "Food": food_total,
            "Transportation": transport_total,
            "Shopping": shopping_buffer,
            "Insurance": insurance,
            "Emergency Fund": emergency_fund,
        }

        # Savings advice
        savings_tips = []
        if estimated_total > 2000:
            savings_tips.append(
                "Consider staying in boutique hostry or high-rated apartments to cut hotel costs by 30%."
            )
            savings_tips.append(
                "Purchase a 72-hour unlimited subway pass to eliminate individual taxi expenses."
            )

        return {
            "status": "success",
            "duration_days": duration_days,
            "number_of_people": num_people,
            "estimated_total_usd": estimated_total,
            "category_breakdown": categories,
            "savings_recommendations": savings_tips,
        }


class PackingListSkill:
    @staticmethod
    def execute(
        destination: str, weather_condition: str, duration_days: int
    ) -> dict[str, Any]:
        return get_packing_suggestions_tool(
            destination, weather_condition, duration_days
        )


class CurrencyExchangeSkill:
    @staticmethod
    def execute(from_currency: str, to_currency: str) -> dict[str, Any]:
        return get_currency_exchange_rate_tool(from_currency, to_currency)


class SafetyLookupSkill:
    @staticmethod
    def execute(country: str) -> dict[str, Any]:
        return get_safety_advisory_tool(country)


class LocalEtiquetteSkill:
    @staticmethod
    def execute(location: str) -> dict[str, Any]:
        return get_local_guide_tips_tool(location)


class LocalTransportSkill:
    @staticmethod
    def execute(location: str) -> dict[str, Any]:
        return get_local_transport_options_tool(location)


class PhraseTranslationSkill:
    @staticmethod
    def execute(text: str, target_language: str) -> dict[str, Any]:
        return translate_text_tool(text, target_language)


class DocumentParsingSkill:
    @staticmethod
    def execute(file_path: str) -> dict[str, Any]:
        return parse_uploaded_document_tool(file_path)
