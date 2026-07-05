# TravelMission AI: User Workflow & Operational Lifecycle

This document explains the step-by-step user journey and backend agent lifecycle.

---

## 1. User Workflow Diagram

```mermaid
graph TD
    Start([User opens TravelMission AI Dashboard]) --> Form[Launch New Mission Form]
    Form -->|Select City, Dates, Budget, Currencies| Assemble[Click 'Assemble Agent Team']
    
    subgraph Multi-Agent Processing
        Assemble --> Init[Orchestrator creates Session]
        Init --> Stream[WebSocket gateway opens]
        
        subgraph Parallel Agent Reasoners
            Flight[Flight Agent scans routes]
            Hotel[Hotel Agent evaluates boutique stays]
            Visa[Visa Agent audits credentials]
            Weather[Weather Agent checks conditions]
            Safety[Safety Agent reviews risk scores]
            Currency[Currency Agent calculates rates]
        end
        
        Init --> Flight & Hotel & Visa & Weather & Safety & Currency
        
        Weather -->|Rain alert on Day 2| State[Shared Session State]
        State -->|Reschedule outdoors| Activity[Activity Agent builds timetable]
        State -->|Add rain gear| Packing[Packing Agent compiles list]
        
        Flight & Hotel -->|Submit costs| Budget[Budget Agent balancing]
    end
    
    Parallel Agent Reasoners --> Agg[Orchestrator validates structured outputs]
    Agg --> DB[(SQLite Database)]
    DB -->|WebSocket Feed| UI[Mission Board Updates Live]
    
    UI --> Tab[Dashboard Tabs Activated]
    Tab --> Overview[Overview: Health Score, Dual cost metrics]
    Tab --> Timeline[Timeline: Curated morning/evening agenda]
    Tab --> Ledger[Budget: Pie charts & local cash splits]
    Tab --> Intel[Currency: Rates, Payment advice, weekly trend charts]
    Tab --> Docs[Documents: Scan credentials, verification state]
```

### Explanatory Analysis
The **User Workflow Diagram** illustrates the end-to-end user journey:
1. **Mission Initialization**: The user opens the dashboard, specifies parameters (such as destination, dates, budget, home currency, and destination currency), and clicks **Assemble Agent Team**.
2. **Real-time Streaming**: The Orchestrator initializes the session and streams logs to the dashboard via WebSockets.
3. **Parallel Execution**: Specialized agents run in parallel to resolve flights, hotels, visa requirements, and safety scores.
4. **Reactive Replanning**: If the Weather Agent detects rain, it updates the shared session state. The Activity Planner automatically reschedules outdoor events to indoor locations, and the Packing Agent adds rain gear.
5. **Dashboard Updates**: Once execution completes, the dashboard tabs activate, displaying the timeline, budget allocations, currency trends, and payment advice.

---

## 2. Interactive Features & Actions

After the team compiles the plan, the traveler can perform several actions:
* **Currency Intelligence**: Toggle budget charts between home and destination currencies to see how exchange rates affect their wallet.
* **Document Auditing**: Upload passports or tickets. The Visa Agent parses them via the Filesystem MCP and masks sensitive details to protect privacy.
* **Travel Brief Export**: Download a text briefing containing emergency numbers, schedules, and budgets.
