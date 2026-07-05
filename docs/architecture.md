# TravelMission AI: System Architecture & Data Flow

This document details the overall system architecture, runtime sequences, and data flow pathways of TravelMission AI.

---

## 1. System Architecture

```mermaid
graph TD
    User([User / Browser]) <-->|HTTP / WebSockets| FE[Next.js Frontend]
    FE <-->|REST API / WS Gateway| BE[FastAPI Backend]
    
    subgraph Operations Center
        BE <-->|Runner Instance| Orchestrator[Orchestrator Agent]
        Orchestrator <-->|thought_logger / DB Session| DB[(SQLite Database)]
    end
    
    subgraph Multi-Agent Hub
        Orchestrator <-->|Agent Delegation| Specialists[12 Specialized Agents]
        Specialists <-->|Tool Execution| Tools[Custom Python Tools]
        Specialists <-->|Stdio Protocol| MCP[Filesystem MCP Server]
    end
    
    subgraph External Infrastructure
        Tools -->|Rest Queries| APIs[External APIs / Live Exchange Rates]
    end
```

### Explanatory Analysis
The **Overall System Architecture** follows a modern full-stack decoupled model optimized for multi-agent coordination. The **Next.js Frontend** serves a glassmorphic dashboard that communicates with the **FastAPI Backend** using REST endpoints for command triggers and a bi-directional **WebSocket Event Gateway** for real-time operations streaming. 

The backend instantiates the **Google ADK Orchestrator Agent**, which acts as the central brain. It delegates operations to **12 specialized agents**, which are isolated reasoners. These agents invoke specific **Custom Python Tools** (for live exchange rates, weather, and budget metrics) or connect via standard stdio to the **Filesystem MCP Server** to read user-uploaded travel briefs, write logs, and persist trip schedules in the local **SQLite Database**.

---

## 2. Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant FE as Next.js Dashboard
    participant BE as FastAPI Server
    participant ORCH as Orchestrator Agent
    participant SPEC as Specialist Agents
    participant MCP as Filesystem MCP
    participant DB as SQLite DB

    User->>FE: Click "Assemble Agent Team" (Tokyo)
    FE->>BE: POST /api/trips
    BE->>DB: Insert Trip (Status: Planning)
    BE->>ORCH: Trigger Background Task (execute_travel_mission)
    ORCH->>ORCH: runner.session_service.create_session()
    ORCH->>DB: Log Orchestrator Thought (Activity Feed)
    BE-->>FE: Return Trip Details (Initialize WS Feed connection)
    
    par Parallel Agent Delegation
        ORCH->>SPEC: Delegate Flight Search
        SPEC->>BE: Run search_flights_tool
        BE-->>SPEC: Flight costs resolved
        
        ORCH->>SPEC: Delegate Visa Checks
        SPEC->>MCP: Use filesystem_mcp (Read passport info)
        MCP-->>SPEC: Return parsed PDF details
        
        ORCH->>SPEC: Delegate Weather
        SPEC->>BE: Run get_weather_forecast_tool
        BE-->>SPEC: Forecast resolved
    end
    
    SPEC->>DB: Log thoughts & tool results (Activity Feed)
    DB-->>FE: Stream updates via WebSockets
    FE->>User: Real-time logs render in Dashboard Feed
    
    ORCH->>DB: Insert Itinerary Items & Budget Logs
    ORCH->>DB: Update Trip Status (Planning -> Ready)
    DB-->>FE: Broadcast completion event
    FE->>User: Render Mission Timeline and Pie Charts
```

### Explanatory Analysis
The **Sequence Diagram** illustrates the end-to-end execution path when a traveler launches a new travel mission. The backend immediately returns the database record to let the frontend open a real-time WebSocket connection to stream logs. 

In the background, the Orchestrator initiates an ADK session and delegates tasks in parallel to specialized agents (e.g. Flight, Visa, and Weather agents). The Visa Agent utilizes the stdio-based `filesystem_mcp` server to inspect uploaded travel credentials. Every thought, tool call, and result is committed to the database and pushed to the client browser in real time. Finally, the Orchestrator aggregates the results, populates the itinerary and budget log tables, and changes the trip status to `Ready`.

---

## 3. Data Flow Diagram

```mermaid
graph LR
    Input[User Input: Destination, Budget] -->|Pydantic Audit| API[FastAPI Endpoint]
    API -->|Session Init| DB[(SQLite DB)]
    API -->|Background task| Orchestrator[Orchestrator]
    
    Orchestrator -->|Context Delegation| Agents[Specialist Agents]
    Agents -->|Tool Arguments| Skills[Python Skills / MCP Tools]
    Skills -->|Exchange / Weather queries| External[External APIs]
    
    External -->|Raw Data| Skills
    Skills -->|Structured Dicts| Agents
    Agents -->|Thoughts & Tool Calls| Logger[ADK Callbacks]
    
    Logger -->|Insert logs| DB
    DB -->|WebSocket Send| WS[WS Gateway]
    WS -->|Live Updates| FE[Dashboard Feed]
```

### Explanatory Analysis
The **Data Flow Diagram** shows how data propagates through the system. Raw inputs are first audited by **Pydantic Schemas** to prevent SQL injection or rate-limit exploits. Once sanitized, data is stored in the **SQLite DB** and sent to the **Orchestrator**. 

The Orchestrator shares this context with the **Specialist Agents**. The agents invoke **Python Skills** and **MCP Tools**, calling **External APIs** to fetch weather and exchange rates. The raw JSON is structured into typed dicts by the skills and returned to the agents. The ADK callbacks record the step logs in the database, which triggers the **WebSocket Gateway** to push updates to the user's dashboard.
