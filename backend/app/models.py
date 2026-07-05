import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Trip(Base):
    __tablename__ = "trips"
    id = Column(Integer, primary_key=True, index=True)
    destination = Column(String, index=True)
    start_date = Column(String)
    end_date = Column(String)
    budget_total = Column(Float)
    currency = Column(String, default="USD")
    home_currency = Column(String, default="USD")
    status = Column(
        String, default="Planning"
    )  # Planning, Active, Completed, Cancelled
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    itinerary_items = relationship(
        "ItineraryItem", back_populates="trip", cascade="all, delete-orphan"
    )
    budget_logs = relationship(
        "BudgetLog", back_populates="trip", cascade="all, delete-orphan"
    )
    activities = relationship(
        "AgentActivity", back_populates="trip", cascade="all, delete-orphan"
    )
    documents = relationship(
        "UserDocument", back_populates="trip", cascade="all, delete-orphan"
    )


class ItineraryItem(Base):
    __tablename__ = "itinerary_items"
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"))
    day_number = Column(Integer)
    time_of_day = Column(String)  # Morning, Afternoon, Evening
    title = Column(String)
    description = Column(Text)
    location = Column(String)
    cost = Column(Float, default=0.0)
    cost_home_currency = Column(Float, default=0.0, nullable=True)
    agent_notes = Column(Text, nullable=True)
    weather_notes = Column(Text, nullable=True)

    trip = relationship("Trip", back_populates="itinerary_items")


class BudgetLog(Base):
    __tablename__ = "budget_logs"
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"))
    category = Column(
        String
    )  # Flight, Hotel, Food, Transportation, Shopping, Visa, Insurance, Emergency
    estimated_cost = Column(Float)
    cost_home_currency = Column(Float, default=0.0, nullable=True)
    actual_cost = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)

    trip = relationship("Trip", back_populates="budget_logs")


class AgentActivity(Base):
    __tablename__ = "agent_activities"
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"))
    agent_name = Column(String)
    activity_type = Column(String)  # Thought, ToolCall, Delegation, Result
    message = Column(Text)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    trip = relationship("Trip", back_populates="activities")


class UserDocument(Base):
    __tablename__ = "user_documents"
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"))
    file_name = Column(String)
    file_path = Column(String)
    file_type = Column(String)
    parsed_content = Column(Text, nullable=True)
    status = Column(String, default="Processing")  # Processing, Parsed, Failed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    trip = relationship("Trip", back_populates="documents")
