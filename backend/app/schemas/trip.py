from datetime import datetime

from pydantic import BaseModel


class ItineraryItemBase(BaseModel):
    day_number: int
    time_of_day: str
    title: str
    description: str
    location: str
    cost: float = 0.0
    cost_home_currency: float | None = 0.0
    agent_notes: str | None = None
    weather_notes: str | None = None


class ItineraryItemCreate(ItineraryItemBase):
    pass


class ItineraryItem(ItineraryItemBase):
    id: int
    trip_id: int

    class Config:
        from_attributes = True


class BudgetLogBase(BaseModel):
    category: str
    estimated_cost: float
    cost_home_currency: float | None = 0.0
    actual_cost: float = 0.0
    notes: str | None = None


class BudgetLogCreate(BudgetLogBase):
    pass


class BudgetLog(BudgetLogBase):
    id: int
    trip_id: int

    class Config:
        from_attributes = True


class UserDocumentBase(BaseModel):
    file_name: str
    file_type: str
    status: str


class UserDocument(UserDocumentBase):
    id: int
    trip_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class TripBase(BaseModel):
    destination: str
    start_date: str
    end_date: str
    budget_total: float
    currency: str = "USD"
    home_currency: str = "USD"


class TripCreate(TripBase):
    pass


class TripUpdateStatus(BaseModel):
    status: str


class Trip(TripBase):
    id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class TripDetail(Trip):
    itinerary_items: list[ItineraryItem] = []
    budget_logs: list[BudgetLog] = []
    documents: list[UserDocument] = []

    class Config:
        from_attributes = True


class TripChatRequest(BaseModel):
    message: str
