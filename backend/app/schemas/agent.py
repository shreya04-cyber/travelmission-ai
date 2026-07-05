from datetime import datetime

from pydantic import BaseModel


class AgentActivityBase(BaseModel):
    agent_name: str
    activity_type: str  # Thought, ToolCall, Delegation, Result
    message: str


class AgentActivityCreate(AgentActivityBase):
    pass


class AgentActivity(AgentActivityBase):
    id: int
    trip_id: int
    timestamp: datetime

    class Config:
        from_attributes = True


class AgentStateItem(BaseModel):
    name: str
    role: str
    goal: str
    status: str  # idle, active, completed
    last_action: str
