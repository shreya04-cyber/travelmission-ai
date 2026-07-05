import datetime
import os
import random
from typing import Any


def search_flights_tool(origin: str, destination: str, date: str) -> dict[str, Any]:
    """Search for flights between origin and destination on a given date.

    Args:
        origin: The starting airport code (e.g., SFO, JFK).
        destination: The destination airport code (e.g., HND, CDG).
        date: The date of travel in YYYY-MM-DD format.

    Returns:
        A dictionary containing flight options, prices, and airline details.
    """
    airlines = [
        "All Nippon Airways",
        "Japan Airlines",
        "United Airlines",
        "Delta Air Lines",
        "Air France",
        "British Airways",
    ]
    options = []

    # Generate realistic flights
    for _ in range(3):
        price = random.randint(450, 1200)
        airline = random.choice(airlines)
        duration_hours = random.randint(6, 14)
        options.append(
            {
                "flight_number": f"{airline[:2].upper()}{random.randint(100, 999)}",
                "airline": airline,
                "origin": origin,
                "destination": destination,
                "departure_time": f"{random.randint(6, 22):02d}:{random.choice([0, 15, 30, 45]):02d}",
                "price_usd": price,
                "duration": f"{duration_hours}h {random.randint(0, 59)}m",
                "stops": random.choice([0, 1]),
                "baggage_fee_estimate_usd": random.choice([30, 45, 60]),
            }
        )

    sorted_options = sorted(options, key=lambda x: x["price_usd"])

    # Check alternate airports
    alternate_airports = []
    if destination.upper() in ["HND", "NRT"]:
        alt = "NRT" if destination.upper() == "HND" else "HND"
        alternate_airports.append(
            {"code": alt, "city": "Tokyo", "reason": "Alternate airport serving Tokyo"}
        )
    elif destination.upper() in ["CDG", "ORY"]:
        alt = "ORY" if destination.upper() == "CDG" else "CDG"
        alternate_airports.append(
            {"code": alt, "city": "Paris", "reason": "Alternate airport serving Paris"}
        )

    return {
        "status": "success",
        "search_parameters": {
            "origin": origin,
            "destination": destination,
            "date": date,
        },
        "flights": sorted_options,
        "cheapest_option": sorted_options[0],
        "alternative_airports": alternate_airports,
        "notes": "Prices are estimates and fluctuate based on season. Recommending booking 60 days in advance.",
    }


def search_hotels_tool(
    destination: str, checkin_date: str, checkout_date: str
) -> dict[str, Any]:
    """Recommend hotels in the destination area with ratings, safety, and transit scores.

    Args:
        destination: The city or region name.
        checkin_date: The check-in date in YYYY-MM-DD format.
        checkout_date: The check-out date in YYYY-MM-DD format.

    Returns:
        A dictionary containing recommended hotels, prices, safety, and transportation scores.
    """
    hotel_names = {
        "tokyo": [
            "Shibuya Horizon Hotel",
            "Roppongi Luxury Suites",
            "Shinjuku Garden Inn",
            "Asakusa Traditional Ryokan",
        ],
        "paris": [
            "Le Marais Boutique Hotel",
            "Eiffel Tower View Resort",
            "Montmartre Artist Inn",
            "St. Germain Plaza",
        ],
        "london": [
            "Covent Garden Royal",
            "Soho Boutique Suites",
            "Westminster Palace View",
            "Paddington Park Inn",
        ],
        "default": [
            "Grand Plaza Hotel",
            "Centennial Heights Inn",
            "Vibe Boutique Lodges",
            "Metro Hub Hotel",
        ],
    }

    key = destination.lower()
    names = hotel_names.get(key, hotel_names["default"])
    hotels = []

    for _, name in enumerate(names):
        price = random.randint(120, 450)
        safety_score = random.randint(85, 98)
        transit_score = random.randint(80, 99)
        hotels.append(
            {
                "name": name,
                "stars": random.choice([3, 4, 5]),
                "price_per_night_usd": price,
                "safety_score": safety_score,
                "transport_score": transit_score,
                "description": f"Located near key attractions with a {safety_score}% local safety rating.",
                "amenities": random.sample(
                    [
                        "Free Wi-Fi",
                        "Breakfast Included",
                        "Gym",
                        "Rooftop Pool",
                        "Spa",
                        "24/7 Security",
                    ],
                    4,
                ),
            }
        )

    return {
        "status": "success",
        "destination": destination,
        "dates": {"check_in": checkin_date, "checkout": checkout_date},
        "hotels": hotels,
        "best_deal": min(hotels, key=lambda x: x["price_per_night_usd"]),
    }


def check_visa_requirements_tool(
    passport_country: str, destination_country: str
) -> dict[str, Any]:
    """Check visa entry requirements, passport validity guidelines, and processing times.

    Args:
        passport_country: The country of citizenship of the traveler.
        destination_country: The country the traveler is visiting.

    Returns:
        A dictionary detailing visa requirements, documentation checklists, and fees.
    """
    # Simple logic mapping
    pc = passport_country.lower()
    dc = destination_country.lower()

    visa_required = True
    details = ""
    processing_time = "5-7 business days"
    fee_usd = 60.0
    documents = [
        "Valid Passport",
        "2 Passport Photos",
        "Round-trip Flight Itinerary",
        "Hotel Reservation Confirmation",
        "Proof of Sufficient Funds",
    ]

    if pc in [
        "united states",
        "us",
        "usa",
        "canada",
        "united kingdom",
        "uk",
    ] and dc in ["japan", "france", "germany", "italy", "united kingdom", "uk"]:
        visa_required = False
        details = "Visa-free entry (Visa Waiver Program / Schengen area rules) for stays up to 90 days. Passport must be valid for at least 6 months beyond the date of entry."
        processing_time = "Immediate (Visa Free)"
        fee_usd = 0.0
        documents = [
            "Valid Passport (at least 6 months validity)",
            "Proof of Return/Onward Travel",
        ]
    elif dc == "japan":
        details = "eVisa available for select nationalities. Standard tourist visa required for others. Passport must be valid for the duration of stay."
        processing_time = "3-5 business days"
        fee_usd = 25.0
    else:
        details = f"Tourist Visa required for citizens of {passport_country} traveling to {destination_country}. Apply at the nearest embassy/consulate."

    return {
        "status": "success",
        "passport_country": passport_country,
        "destination_country": destination_country,
        "visa_required": visa_required,
        "entry_rules": details,
        "passport_validity_required": "6 months minimum recommended",
        "processing_time_estimate": processing_time,
        "visa_fee_usd": fee_usd,
        "required_documents_checklist": documents,
    }


def get_weather_forecast_tool(location: str, date: str) -> dict[str, Any]:
    """Retrieve weather forecast and warning alerts for a travel location.

    Args:
        location: The destination city name.
        date: The target date in YYYY-MM-DD format.

    Returns:
        A weather report dictionary with temperature, humidity, UV index, and alerts.
    """
    # Simulated weather forecast
    conditions = ["Sunny", "Partly Cloudy", "Cloudy", "Rainy", "Thunderstorm", "Windy"]
    condition = random.choice(conditions)
    temp = random.randint(15, 32)  # Celsius

    # Check if rain/thunderstorm
    rain_alert = "Rainy" in condition or "Thunderstorm" in condition
    alert_message = None
    if rain_alert:
        alert_message = (
            "Heavy rain warning: Outdoor activities should be moved indoors."
        )

    return {
        "status": "success",
        "location": location,
        "date": date,
        "forecast": {
            "temperature_c": temp,
            "temperature_f": int(temp * 1.8 + 32),
            "humidity_percent": random.randint(40, 95),
            "uv_index": random.randint(1, 11),
            "condition": condition,
            "wind_speed_kph": random.randint(5, 30),
        },
        "alerts": {"rain_warning": rain_alert, "alert_message": alert_message},
    }


def get_currency_exchange_rate_tool(
    from_currency: str, to_currency: str
) -> dict[str, Any]:
    """Retrieve the exchange rate and calculate ATM fee recommendations.

    Args:
        from_currency: The base currency code (e.g., USD).
        to_currency: The target currency code (e.g., JPY, EUR).

    Returns:
        A dictionary containing exchange rate and local ATM cash advice.
    """
    rates = {
        "USD_JPY": 155.45,
        "USD_EUR": 0.92,
        "USD_GBP": 0.78,
        "EUR_USD": 1.09,
        "GBP_USD": 1.28,
        "JPY_USD": 0.0064,
        "USD_CAD": 1.36,
    }

    pair = f"{from_currency.upper()}_{to_currency.upper()}"
    rate = rates.get(
        pair, rates.get(f"{to_currency.upper()}_{from_currency.upper()}", 1.0)
    )
    if pair not in rates and f"{to_currency.upper()}_{from_currency.upper()}" in rates:
        rate = 1.0 / rate

    # ATM Cash suggestion
    atm_advice = "It is highly recommended to withdraw cash at 7-Eleven or Post Office ATMs for the lowest foreign transaction fees. Most high-end stores and restaurants accept international Credit Cards."
    if to_currency.upper() == "EUR":
        atm_advice = "Schengen zone ATMs (especially bank-branded like BNP Paribas, Santander) offer excellent rates. Avoid Euronet ATMs which have high markup fees. Credit cards are widely accepted."

    return {
        "status": "success",
        "from_currency": from_currency.upper(),
        "to_currency": to_currency.upper(),
        "exchange_rate": rate,
        "atm_withdraw_recommendation": atm_advice,
        "cash_versus_card_percentage": {"card": 75, "cash": 25},
    }


def get_safety_advisory_tool(country: str) -> dict[str, Any]:
    """Get security status, travel advisories, emergency numbers, and regional alerts.

    Args:
        country: The destination country name.

    Returns:
        A dictionary containing safety scores, emergency coordinates, and advisories.
    """
    emergencies = {
        "japan": {
            "police": "110",
            "fire_ambulance": "119",
            "safety_score": 96,
            "advisory_level": 1,
        },
        "france": {
            "police": "17",
            "fire_ambulance": "18",
            "safety_score": 82,
            "advisory_level": 2,
        },
        "united kingdom": {
            "police": "999",
            "fire_ambulance": "999",
            "safety_score": 85,
            "advisory_level": 2,
        },
        "default": {
            "police": "112",
            "fire_ambulance": "112",
            "safety_score": 75,
            "advisory_level": 2,
        },
    }

    key = country.lower()
    details = emergencies.get(key, emergencies["default"])

    scams = ["Pickpocketing at major train stations", "Unlicensed taxis at airports"]
    if key == "japan":
        scams = [
            "Overcharging at hostess clubs in Kabukicho",
            "Fake charity collectors in tourist centers",
        ]
    elif key == "france":
        scams = [
            "Friendship bracelet scam around Sacré-Cœur",
            "Petition signature scammers near Eiffel Tower",
        ]

    return {
        "status": "success",
        "country": country,
        "safety_score_percentage": details["safety_score"],
        "state_dept_advisory_level": details["advisory_level"],
        "emergency_contacts": {
            "police": details["police"],
            "ambulance": details["fire_ambulance"],
            "international_standard": "112",
        },
        "scam_warnings": scams,
        "recommendations": [
            "Keep digital copies of passport in cloud storage.",
            "Avoid carrying large amounts of cash in crowded spaces.",
            "Register for the Smart Traveler Enrollment Program (STEP) if you are a US citizen.",
        ],
    }


def get_local_guide_tips_tool(location: str) -> dict[str, Any]:
    """Provide local etiquette, cultural rules, hidden gems, and dining rules.

    Args:
        location: The destination city or region name.

    Returns:
        A local guide dictionary containing hidden gems and cultural suggestions.
    """
    tips = {
        "tokyo": {
            "gems": [
                "Todoroki Valley (a quiet bamboo jungle in the city)",
                "Yanaka Ginza (Old Tokyo vibes)",
                "Shimokitazawa vintage stores",
            ],
            "etiquette": "No tipping in restaurants. Do not walk while eating. Keep left on escalators.",
            "dining": "Try Tsukiji Outer Market for breakfast. Eat ramen by buying tickets at machines.",
        },
        "paris": {
            "gems": [
                "La Petite Ceinture (abandoned railway nature walk)",
                "Palais de Tokyo (modern art & cafe)",
                "Canal Saint-Martin (local picnic)",
            ],
            "etiquette": "Always say 'Bonjour' when entering a shop. Keep voices low in restaurants.",
            "dining": "Order the 'plat du jour' (daily special). Tipping is appreciated but service charge (service compris) is included.",
        },
        "default": {
            "gems": [
                "Local historic district alleys",
                "Rooftop observation decks",
                "Farmers markets on weekends",
            ],
            "etiquette": "Respect local customs, dress modestly when visiting holy sites, and ask permission before photographing individuals.",
            "dining": "Eat where locals line up. Check if reservation is required in advance.",
        },
    }

    key = location.lower()
    details = tips.get(key, tips["default"])

    return {
        "status": "success",
        "location": location,
        "hidden_gems": details["gems"],
        "cultural_etiquette": details["etiquette"],
        "dining_recommendations": details["dining"],
    }


def get_packing_suggestions_tool(
    destination: str, weather_condition: str, duration_days: int
) -> dict[str, Any]:
    """Generate a dynamic packing checklist matching destination, weather, and length.

    Args:
        destination: The destination city name.
        weather_condition: Expected weather (e.g., Rainy, Sunny, Snowy).
        duration_days: Length of the trip in days.

    Returns:
        A list of recommended items categorized by necessity.
    """
    items = [
        "Passports & Visas",
        "Credit Cards & Cash",
        "Phone & Charger",
        "First Aid Kit",
        "Toiletries",
    ]
    clothing = [
        f"{min(duration_days, 7)}x Underwear",
        f"{min(duration_days, 7)}x Socks",
    ]

    cond = weather_condition.lower()
    if "rain" in cond or "thunder" in cond:
        items.extend(
            ["Travel Umbrella", "Waterproof Shoes", "Ziploc Bags for Electronics"]
        )
        clothing.extend(["Raincoat / Windbreaker", "Extra socks (dry change)"])
    elif "snow" in cond or "cold" in cond:
        items.extend(["Hand warmers", "Lip balm"])
        clothing.extend(
            ["Heavy Winter Coat", "Thermal base layer", "Beanie & Gloves", "Scarf"]
        )
    else:
        items.extend(["Sunglasses", "Sunscreen (SPF 50)", "Refillable Water Bottle"])
        clothing.extend(["Lightweight T-shirts", "Hat", "Walking shorts"])

    return {
        "status": "success",
        "packing_parameters": {
            "destination": destination,
            "weather": weather_condition,
            "duration": duration_days,
        },
        "required_documents": [
            "Passport",
            "Tickets",
            "Travel Insurance Policy",
            "Printed Visa (if applicable)",
        ],
        "clothing_list": clothing,
        "electronics": ["Phone + Chargers", "Universal Travel Adapter", "Power Bank"],
        "medical_kit": [
            "Painkillers",
            "Allergy medications",
            "Band-aids",
            "Stomach settlers",
        ],
        "miscellaneous": items,
    }


def translate_text_tool(text: str, target_language: str) -> dict[str, Any]:
    """Translate essential travel phrases into target language with pronunciation.

    Args:
        text: The English phrase to translate.
        target_language: The language code or name (e.g., Japanese, French).

    Returns:
        A dictionary with the translated phrase and phonetic guide.
    """
    phrases = {
        "hello": {
            "japanese": {
                "translation": "こんにちは (Konnichiwa)",
                "phonetic": "kon-nee-chee-wah",
            },
            "french": {"translation": "Bonjour", "phonetic": "bohn-zhoor"},
        },
        "thank you": {
            "japanese": {
                "translation": "ありがとうございます (Arigatou gozaimasu)",
                "phonetic": "ah-ree-gah-toe go-zah-ee-mahs",
            },
            "french": {"translation": "Merci", "phonetic": "mair-see"},
        },
        "emergency": {
            "japanese": {
                "translation": "緊急事態です (Kinkyuu jitai desu)",
                "phonetic": "keen-kyoo jee-tie dess",
            },
            "french": {
                "translation": "C'est une urgence",
                "phonetic": "say teen oor-zhahns",
            },
        },
        "where is the bathroom?": {
            "japanese": {
                "translation": "お手洗いはどこですか? (Otearai wa doko desu ka?)",
                "phonetic": "oh-teh-ah-rye wah doh-ko dess kah?",
            },
            "french": {
                "translation": "Où sont les toilettes?",
                "phonetic": "oo sohn lay twah-let?",
            },
        },
    }

    t_lang = target_language.lower()
    t_text = text.lower()

    result = phrases.get(t_text, {}).get(
        t_lang,
        {
            "translation": f"[Translation of '{text}' to {target_language}]",
            "phonetic": "[Pronunciation guide]",
        },
    )

    return {
        "status": "success",
        "input_text": text,
        "target_language": target_language,
        "translation": result["translation"],
        "pronunciation_guide": result["phonetic"],
    }


def get_local_transport_options_tool(location: str) -> dict[str, Any]:
    """Retrieve airport transit options and daily public transport passes.

    Args:
        location: The destination city name.

    Returns:
        A dictionary of airport shuttle, metro, taxi, and walking routes.
    """
    transports = {
        "tokyo": {
            "airport_transfer": "Narita Express (N'EX) to Tokyo Station (55 mins, 3,070 JPY) or Tokyo Monorail from Haneda Airport to Hamamatsucho (13 mins, 500 JPY).",
            "passes": "Suica/Pasmo IC card or Tokyo Subway 72-Hour ticket (1,500 JPY for unlimited Metro rides).",
            "taxi_info": "Highly reliable but expensive. Base fare starts around 500 JPY.",
            "walking_friendly": True,
        },
        "paris": {
            "airport_transfer": "RER B train from CDG Airport to central Paris (Châtelet) (45 mins, 11.80 EUR) or RoissyBus shuttle.",
            "passes": "Navigo Easy card or Paris Visite pass (unlimited zones 1-3).",
            "taxi_info": "Use official ranks outside terminals. Fixed rates apply (approx 55-65 EUR from CDG to Left/Right banks).",
            "walking_friendly": True,
        },
        "default": {
            "airport_transfer": "Official Airport Express Train or Airport Taxi ranks.",
            "passes": "City Card or Day Pass for unlimited subway/bus rides.",
            "taxi_info": "Download local ridesharing apps (Uber, Grab, Bolt) depending on region.",
            "walking_friendly": True,
        },
    }

    key = location.lower()
    details = transports.get(key, transports["default"])

    return {
        "status": "success",
        "location": location,
        "airport_transfer_routes": details["airport_transfer"],
        "recommended_passes": details["passes"],
        "taxi_rideshare_info": details["taxi_info"],
        "walking_friendly_city": details["walking_friendly"],
    }


def generate_travel_brief_pdf_tool(trip_id: int) -> dict[str, Any]:
    """Generate a downloadable PDF travel brief summary for a trip mission.

    Args:
        trip_id: The unique ID of the trip.

    Returns:
        A dictionary with file details, download url, and a markdown preview.
    """
    # Simulate PDF brief generation
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    file_name = f"travel_brief_trip_{trip_id}_{timestamp}.pdf"

    # We will simulate PDF creation by outputting a markdown brief that the client can render
    brief = f"""
# TRAVELMISSION AI - OFFICIAL BRIEF
*Trip Reference ID: #{trip_id}*
*Generated on: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}*

---

## 1. Executive Summary
This document constitutes your personal Mission Brief compiled by the TravelMission AI Orchestrator.

## 2. Flight & Accommodation
* Flight: Confirmed details retrieved via Flight Agent.
* Hotel: Location-optimized and safety-rated.

## 3. Packing & Weather Checklist
* Target weather: Verified.
* Medical and electronic checklist appended.

## 4. Local Rules & Safety
* Keep emergency contacts handy.
* Read through custom guide cultural etiquette.
"""

    return {
        "status": "success",
        "trip_id": trip_id,
        "file_name": file_name,
        "download_url": f"/api/trips/{trip_id}/download-pdf",
        "brief_preview_markdown": brief,
    }


def parse_uploaded_document_tool(file_path: str) -> dict[str, Any]:
    """Parse passports, visas, or airline tickets using simulated OCR/Document AI.

    Args:
        file_path: The absolute path of the uploaded document file.

    Returns:
        A dictionary of parsed details (e.g., traveler name, expiry date, ticket number).
    """
    name = os.path.basename(file_path).lower()

    parsed_data = {}
    doc_type = "Unknown"

    if "passport" in name:
        doc_type = "Passport"
        parsed_data = {
            "traveler_name": "JOHN DOE",
            "document_number": f"L{random.randint(10000000, 99999999)}",
            "nationality": "United States",
            "birth_date": "1990-05-15",
            "expiry_date": "2031-10-12",
            "validity_status": "Valid (6+ months remaining)",
        }
    elif "ticket" in name or "flight" in name:
        doc_type = "Flight Ticket"
        parsed_data = {
            "passenger": "JOHN DOE",
            "airline": "United Airlines",
            "flight_number": "UA837",
            "origin": "SFO",
            "destination": "HND",
            "departure_time": "2026-10-15 11:45",
            "booking_reference": f"PNR{random.randint(100000, 999999)}",
        }
    else:
        doc_type = "Generic Travel Document"
        parsed_data = {
            "details": "Parsed text from general document. No specific flight or passport entities recognized."
        }

    return {
        "status": "success",
        "file_path": file_path,
        "document_type": doc_type,
        "extracted_entities": parsed_data,
    }
