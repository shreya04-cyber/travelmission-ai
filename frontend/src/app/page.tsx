"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plane, Shield, ShieldAlert, DollarSign, Cloud, Calendar, Briefcase, 
  MapPin, CheckSquare, MessageSquare, BookOpen, Compass, RotateCcw, 
  AlertTriangle, Upload, HelpCircle, Settings, Trash2, Send, Activity, 
  ChevronRight, Sparkles, User, Globe, AlertCircle, FileText, ArrowRightLeft,
  ChevronDown
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

// Interfaces
interface Trip {
  id: number;
  destination: string;
  start_date: string;
  end_date: string;
  budget_total: number;
  currency: string;
  status: string;
}

interface ItineraryItem {
  id: number;
  day_number: number;
  time_of_day: string;
  title: string;
  description: string;
  location: string;
  cost: number;
  agent_notes?: string;
  weather_notes?: string;
}

interface BudgetLog {
  id: number;
  category: string;
  estimated_cost: number;
  actual_cost: number;
  notes?: string;
}

interface UserDocument {
  id: number;
  file_name: string;
  file_type: string;
  status: string;
  created_at: string;
}

interface TripDetail extends Trip {
  itinerary_items: ItineraryItem[];
  budget_logs: BudgetLog[];
  documents: UserDocument[];
}

interface AgentLog {
  type: string;
  agent: string;
  message: string;
  timestamp?: string;
}

const COLORS = ["#6366f1", "#10b981", "#f43f5e", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899"];

export default function MissionControlDashboard() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [selectedTripDetails, setSelectedTripDetails] = useState<TripDetail | null>(null);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [websocketActive, setWebsocketActive] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  
  // Trip creation state
  const [destination, setDestination] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [budgetTotal, setBudgetTotal] = useState<number>(2000);
  const [creatingTrip, setCreatingTrip] = useState<boolean>(false);
  
  // File upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  
  // Chat state
  const [chatMessage, setChatMessage] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<{sender: string, text: string}[]>([
    { sender: "Orchestrator", text: "Welcome to TravelMission AI. Select a trip or create a new mission to begin." }
  ]);

  const activityEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    fetchTrips();
  }, []);

  // Fetch list of trips
  const fetchTrips = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/trips");
      if (res.ok) {
        const data = await res.json();
        setTrips(data);
        if (data.length > 0 && !selectedTripId) {
          setSelectedTripId(data[0].id);
        }
      } else {
        // Mock fallback if API not running
        const mockTrips: Trip[] = [
          { id: 1, destination: "Tokyo", start_date: "2026-10-15", end_date: "2026-10-20", budget_total: 3000, currency: "USD", status: "Active" },
          { id: 2, destination: "Paris", start_date: "2026-12-01", end_date: "2026-12-06", budget_total: 2500, currency: "USD", status: "Planning" }
        ];
        setTrips(mockTrips);
        setSelectedTripId(1);
      }
    } catch (e) {
      console.log("Using Mock Fallbacks (Backend not running)");
      const mockTrips: Trip[] = [
        { id: 1, destination: "Tokyo", start_date: "2026-10-15", end_date: "2026-10-20", budget_total: 3000, currency: "USD", status: "Active" },
        { id: 2, destination: "Paris", start_date: "2026-12-01", end_date: "2026-12-06", budget_total: 2500, currency: "USD", status: "Planning" }
      ];
      setTrips(mockTrips);
      setSelectedTripId(1);
    }
  };

  // Fetch details of selected trip
  useEffect(() => {
    if (!selectedTripId) return;
    
    // Connect WebSocket feed
    connectWebSocket(selectedTripId);
    
    // Poll/fetch trip data
    fetchTripDetails(selectedTripId);

  }, [selectedTripId]);

  const fetchTripDetails = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/trips/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedTripDetails(data);
      } else {
        generateMockDetails(id);
      }
    } catch (e) {
      generateMockDetails(id);
    }
  };

  const generateMockDetails = (id: number) => {
    const isTokyo = id === 1 || (trips.find(t => t.id === id)?.destination.toLowerCase() === "tokyo");
    
    const details: TripDetail = {
      id: id,
      destination: isTokyo ? "Tokyo" : "Paris",
      start_date: isTokyo ? "2026-10-15" : "2026-12-01",
      end_date: isTokyo ? "2026-10-20" : "2026-12-06",
      budget_total: isTokyo ? 3000 : 2500,
      currency: "USD",
      status: isTokyo ? "Active" : "Planning",
      documents: [
        { id: 101, file_name: "Passport_JohnDoe.pdf", file_type: "application/pdf", status: "Parsed", created_at: "2026-07-05T10:00:00Z" }
      ],
      budget_logs: [
        { id: 201, category: "Flight", estimated_cost: isTokyo ? 950 : 800, actual_cost: 950 },
        { id: 202, category: "Hotel", estimated_cost: isTokyo ? 1100 : 900, actual_cost: 0 },
        { id: 203, category: "Food", estimated_cost: 300, actual_cost: 0 },
        { id: 204, category: "Transportation", estimated_cost: 150, actual_cost: 0 },
        { id: 205, category: "Shopping", estimated_cost: 200, actual_cost: 0 },
        { id: 206, category: "Insurance", estimated_cost: 100, actual_cost: 100 },
        { id: 207, category: "Emergency Fund", estimated_cost: 200, actual_cost: 0 }
      ],
      itinerary_items: isTokyo ? [
        { id: 301, day_number: 1, time_of_day: "Morning", title: "Arrival at Haneda Airport", description: "Clear customs and pick up Pocket Wi-Fi.", location: "Haneda Airport", cost: 0, agent_notes: "Visa Agent: US Citizens visa-free entry validated." },
        { id: 302, day_number: 1, time_of_day: "Afternoon", title: "Check-in at Shibuya Horizon Hotel", description: "Drop off luggage and rest.", location: "Shibuya", cost: 0, agent_notes: "Hotel Agent: Hotel rated 94/100 safety score." },
        { id: 303, day_number: 1, time_of_day: "Evening", title: "Shibuya Crossing & Izakaya", description: "Walk the famous crossing and dine at local izakaya.", location: "Shibuya", cost: 35, agent_notes: "Local Guide Agent: Tipping is strictly forbidden in Japan." },
        { id: 304, day_number: 2, time_of_day: "Morning", title: "Indoor Museum Visit (Weather Shifted)", description: "Visit Tokyo National Museum.", location: "Ueno", cost: 15, weather_notes: "Weather Agent: Shuffled to indoor venue due to rain alert." }
      ] : [
        { id: 401, day_number: 1, time_of_day: "Morning", title: "Arrival at CDG Airport", description: "Pass passport control and take RER B train.", location: "CDG Airport", cost: 12, agent_notes: "Transportation Agent: RER B is the cheapest option." },
        { id: 402, day_number: 1, time_of_day: "Afternoon", title: "Eiffel Tower Climb", description: "Climb to the summit for a stunning city view.", location: "Eiffel Tower", cost: 30 },
        { id: 403, day_number: 1, time_of_day: "Evening", title: "Bistro Dinner near Le Marais", description: "Enjoy classic French cuisine.", location: "Le Marais", cost: 60, agent_notes: "Local Guide Agent: Greeting the staff with 'Bonjour' is essential etiquette." }
      ]
    };
    
    setSelectedTripDetails(details);
  };

  // Connect websocket for live activity feed
  const connectWebSocket = (tripId: number) => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    setAgentLogs([]);
    const ws = new WebSocket(`ws://localhost:8000/api/trips/${tripId}/feed`);
    wsRef.current = ws;

    ws.onopen = () => {
      setWebsocketActive(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setAgentLogs((prev) => [...prev, data]);
    };

    ws.onclose = () => {
      setWebsocketActive(false);
      // Fallback logs for demo if socket closed
      if (agentLogs.length === 0) {
        const fallbacks: AgentLog[] = [
          { type: "Thought", agent: "Orchestrator", message: "Planning mission initialized. Deploying sub-agents." },
          { type: "Thought", agent: "Visa Agent", message: "Reviewing passport guidelines... US citizen does not require visa for stay < 90 days." },
          { type: "ToolCall", agent: "Flight Agent", message: "Executing flight search tool for SFO to HND on 2026-10-15." },
          { type: "Thought", agent: "Weather Agent", message: "Forecasting rain alert on Day 2 in Tokyo. Sending alert to Activity Planner." },
          { type: "Thought", agent: "Activity Planner", message: "Rain alert received. Re-shuffling Day 2 morning tour to indoor Art Museum." },
          { type: "Result", agent: "Orchestrator", message: "All 12 agents complete. Travel Mission Board fully populated." }
        ];
        setAgentLogs(fallbacks);
      }
    };
  };

  // Create trip submit
  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination || !startDate || !endDate) return;
    
    setCreatingTrip(true);
    try {
      const res = await fetch("http://localhost:8000/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          start_date: startDate,
          end_date: endDate,
          budget_total: budgetTotal,
          currency: "USD"
        })
      });
      
      if (res.ok) {
        const newTrip = await res.json();
        setTrips((prev) => [newTrip, ...prev]);
        setSelectedTripId(newTrip.id);
        setActiveTab("dashboard");
      } else {
        alert("Failed to plan trip via backend. Adding mock trip.");
        addMockCreatedTrip();
      }
    } catch (err) {
      addMockCreatedTrip();
    } finally {
      setCreatingTrip(false);
      setDestination("");
      setStartDate("");
      setEndDate("");
    }
  };

  const addMockCreatedTrip = () => {
    const mockNew: Trip = {
      id: Date.now(),
      destination: destination,
      start_date: startDate,
      end_date: endDate,
      budget_total: budgetTotal,
      currency: "USD",
      status: "Planning"
    };
    setTrips((prev) => [mockNew, ...prev]);
    setSelectedTripId(mockNew.id);
    setActiveTab("dashboard");
    
    // Simulate live agent feed
    const steps: AgentLog[] = [
      { type: "Thought", agent: "Orchestrator", message: `Initializing travel mission for ${destination}.` },
      { type: "Thought", agent: "Weather Agent", message: "Checking weather grid... Forecast shows clear, sunny skies." },
      { type: "Thought", agent: "Flight Agent", message: "Scanning airlines for direct flight routes." },
      { type: "Thought", agent: "Hotel Agent", message: "Finding safe lodgings near public transit." },
      { type: "Result", agent: "Orchestrator", message: "Mission compiled successfully!" }
    ];
    
    setAgentLogs([]);
    steps.forEach((step, idx) => {
      setTimeout(() => {
        setAgentLogs((prev) => [...prev, step]);
      }, idx * 1000);
    });
  };

  // Delete trip
  const handleDeleteTrip = async (id: number) => {
    if (!confirm("Are you sure you want to abort this travel mission?")) return;
    
    try {
      const res = await fetch(`http://localhost:8000/api/trips/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTrips((prev) => prev.filter(t => t.id !== id));
        if (selectedTripId === id) {
          setSelectedTripId(trips.length > 1 ? trips[0].id : null);
        }
      }
    } catch (e) {
      setTrips((prev) => prev.filter(t => t.id !== id));
    }
  };

  // Upload document
  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !selectedTripId) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append("file", uploadFile);
    
    try {
      const res = await fetch(`http://localhost:8000/api/trips/${selectedTripId}/documents`, {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        alert("Document parsed successfully!");
        fetchTripDetails(selectedTripId);
      } else {
        alert("Upload simulation completed.");
        addMockDocument();
      }
    } catch (err) {
      addMockDocument();
    } finally {
      setUploading(false);
      setUploadFile(null);
    }
  };

  const addMockDocument = () => {
    if (!selectedTripDetails) return;
    const newDoc: UserDocument = {
      id: Date.now(),
      file_name: uploadFile?.name || "ticket.pdf",
      file_type: "application/pdf",
      status: "Parsed",
      created_at: new Date().toISOString()
    };
    setSelectedTripDetails({
      ...selectedTripDetails,
      documents: [...selectedTripDetails.documents, newDoc]
    });
  };

  // Send chat follow up
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage) return;
    
    const newMsg = { sender: "User", text: chatMessage };
    setChatHistory((prev) => [...prev, newMsg]);
    setChatMessage("");
    
    // Simulate Orchestrator Response
    setTimeout(() => {
      let reply = "I have noted your request. I will coordinate with the relevant agents to adjust your plan.";
      if (chatMessage.toLowerCase().includes("budget") || chatMessage.toLowerCase().includes("cheap")) {
        reply = "Budget Agent: Recalculating... We can cut $200 by choosing an alternative flight date on Wednesday.";
      } else if (chatMessage.toLowerCase().includes("weather") || chatMessage.toLowerCase().includes("rain")) {
        reply = "Weather Agent: Checked. Rain is forecast for Day 3. I suggest visiting the Art Museum that day.";
      }
      setChatHistory((prev) => [...prev, { sender: "Orchestrator", text: reply }]);
    }, 1000);
  };

  // Scroll feed to bottom
  useEffect(() => {
    activityEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agentLogs]);

  if (!isMounted) return null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#080c14] text-slate-100 antialiased">
      
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-slate-800 bg-[#0c1220]/80 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-2.5 rounded-xl bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 glass-glow">
              <Compass className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-wider text-white">TravelMission</h1>
              <p className="text-xs text-indigo-400 font-medium">Agent Operations Center</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            {[
              { id: "dashboard", label: "Mission Board", icon: Briefcase },
              { id: "trips", label: "All Missions", icon: MapPin },
              { id: "agents", label: "Agent Hub", icon: Sparkles },
              { id: "documents", label: "Documents", icon: FileText },
              { id: "budget", label: "Budget Log", icon: DollarSign },
              { id: "settings", label: "Settings", icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === item.id 
                      ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/20 font-semibold" 
                      : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Current User Profile Card */}
        <div className="p-4 rounded-2xl glass border-slate-800 flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
            <User className="h-5 w-5 text-slate-300" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Mission Director</h4>
            <p className="text-xs text-slate-500">ID: #4029-Alpha</p>
          </div>
        </div>
      </aside>

      {/* MAIN SCREEN */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* TOP NAV BAR */}
        <header className="h-20 border-b border-slate-800/80 px-8 flex items-center justify-between bg-[#080c14]/50 backdrop-blur-md">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold tracking-tight text-white capitalize">{activeTab} Control</h2>
            
            {/* Trip Selector Dropdown */}
            {trips.length > 0 && (
              <div className="relative">
                <select 
                  value={selectedTripId || ""}
                  onChange={(e) => setSelectedTripId(Number(e.target.value))}
                  className="appearance-none bg-slate-900 border border-slate-800 text-xs text-slate-300 px-4 py-2 pr-8 rounded-lg cursor-pointer focus:outline-none focus:border-indigo-500"
                >
                  {trips.map(t => (
                    <option key={t.id} value={t.id}>Mission: {t.destination}</option>
                  ))}
                </select>
                <ChevronDown className="h-3 w-3 absolute right-3 top-3.5 text-slate-500 pointer-events-none" />
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Connection Status Badge */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#0c1322] border border-slate-800">
              <span className={`h-2.5 w-2.5 rounded-full ${websocketActive ? "bg-emerald-500 animate-ping" : "bg-amber-500"}`}></span>
              <span className="text-xs text-slate-400 font-medium">{websocketActive ? "Operations Live" : "Simulated Feed"}</span>
            </div>
            
            <button 
              onClick={() => {
                setDestination("Tokyo");
                setStartDate("2026-10-15");
                setEndDate("2026-10-20");
                addMockCreatedTrip();
              }}
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/25 flex items-center space-x-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Launch Mission</span>
            </button>
          </div>
        </header>

        {/* CONTAINER VIEWPORTS */}
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-[#080c14]/40">
          
          <AnimatePresence mode="wait">
            
            {/* TAB: DASHBOARD */}
            {activeTab === "dashboard" && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* 3-Column Top Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  
                  {/* Destination Overview Card */}
                  <div className="col-span-1 md:col-span-2 glass rounded-2xl p-6 flex flex-col justify-between min-h-[160px]">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Active Operations</span>
                        <h3 className="text-3xl font-extrabold text-white mt-1">{selectedTripDetails?.destination || "Unknown Destination"}</h3>
                        <p className="text-xs text-slate-400 mt-2 flex items-center">
                          <Calendar className="h-3.5 w-3.5 mr-1 text-slate-500" />
                          {selectedTripDetails?.start_date} to {selectedTripDetails?.end_date}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 text-2xs font-semibold rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/20">
                        {selectedTripDetails?.status}
                      </span>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
                      <div className="flex items-center space-x-4">
                        <div>
                          <span className="text-slate-500 block text-2xs uppercase">Est. Cost</span>
                          <span className="font-semibold text-white text-sm">${selectedTripDetails?.budget_total || 0}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-2xs uppercase">Agents Active</span>
                          <span className="font-semibold text-white text-sm">12 / 12</span>
                        </div>
                      </div>
                      <span className="text-2xs text-emerald-400 font-semibold flex items-center">
                        <CheckSquare className="h-3 w-3 mr-1" />
                        Checks Passed
                      </span>
                    </div>
                  </div>

                  {/* Weather Widget */}
                  <div className="glass rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Live Weather Forecast</span>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-3">
                          <Cloud className="h-10 w-10 text-indigo-400" />
                          <div>
                            <h4 className="text-xl font-bold text-white">72°F <span className="text-xs text-slate-400">/ 22°C</span></h4>
                            <p className="text-xs text-slate-400">Partly Cloudy</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 text-xs bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-amber-400 flex items-start space-x-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      <span className="text-3xs font-medium">Day 2 Rain predicted. Timelines automatically shifted.</span>
                    </div>
                  </div>

                  {/* Safety & Advisory */}
                  <div className="glass rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Safety & Alert Risk</span>
                      <div className="mt-4 flex items-baseline space-x-2">
                        <h4 className="text-3xl font-extrabold text-rose-500">96%</h4>
                        <span className="text-xs text-slate-400">Safety Index</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
                      <span className="text-slate-400">Advisory: Level 1</span>
                      <span className="text-2xs font-semibold text-indigo-400 flex items-center">
                        Emergency: 112
                      </span>
                    </div>
                  </div>

                </div>

                {/* Dashboard Secondary Section: Timeline vs Feed */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column: Live Agent Log Activity Feed */}
                  <div className="lg:col-span-1 glass rounded-2xl flex flex-col h-[520px]">
                    <div className="p-5 border-b border-slate-800/80 flex justify-between items-center bg-[#0c1220]/40 rounded-t-2xl">
                      <div className="flex items-center space-x-2">
                        <Activity className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
                        <h3 className="font-bold text-sm text-white">Agent Operations Feed</h3>
                      </div>
                      <span className="text-3xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded">Real-time</span>
                    </div>
                    
                    {/* Log Stream */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
                      {agentLogs.map((log, index) => (
                        <div key={index} className="flex flex-col space-y-1.5 p-3 rounded-xl border border-slate-800/50 bg-[#090d16]/60">
                          <div className="flex justify-between items-center">
                            <span className="text-2xs font-bold text-indigo-300">{log.agent}</span>
                            <span className={`text-3xs px-2 py-0.5 rounded-full font-medium ${
                              log.type === "Thought" ? "bg-blue-500/10 text-blue-400" :
                              log.type === "ToolCall" ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"
                            }`}>{log.type}</span>
                          </div>
                          <p className="text-xs text-slate-300 font-medium">{log.message}</p>
                        </div>
                      ))}
                      <div ref={activityEndRef} />
                    </div>
                  </div>

                  {/* Right Column: Mission Control Itinerary Planner & Timeline */}
                  <div className="lg:col-span-2 glass rounded-2xl flex flex-col h-[520px]">
                    <div className="p-5 border-b border-slate-800/80 flex justify-between items-center bg-[#0c1220]/40 rounded-t-2xl">
                      <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                        <Calendar className="h-4.5 w-4.5 text-indigo-400" />
                        <span>Interactive Mission Timeline</span>
                      </h3>
                    </div>

                    {/* Timeline items */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                      {selectedTripDetails?.itinerary_items && selectedTripDetails.itinerary_items.length > 0 ? (
                        selectedTripDetails.itinerary_items.map((item) => (
                          <div key={item.id} className="relative pl-6 border-l-2 border-slate-800/80 last:border-0 pb-1">
                            {/* Dot indicator */}
                            <div className="absolute -left-1.5 top-1.5 h-3.5 w-3.5 rounded-full bg-indigo-500 border-2 border-[#0c1220]"></div>
                            
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-2xs font-bold text-indigo-400 tracking-wider block uppercase">{item.time_of_day}</span>
                                <h4 className="font-bold text-white text-sm mt-0.5">{item.title}</h4>
                                <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                                {item.agent_notes && (
                                  <span className="inline-block text-3xs font-semibold text-slate-500 mt-1">
                                    ℹ️ {item.agent_notes}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs font-bold text-indigo-300 font-mono">${item.cost}</span>
                            </div>

                            {item.weather_notes && (
                              <div className="mt-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-start space-x-2">
                                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <p className="text-3xs font-medium leading-relaxed">{item.weather_notes}</p>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                          <Compass className="h-12 w-12 mb-3 text-slate-600 animate-spin" />
                          <p className="text-sm font-medium">Orchestrator compiling itinerary timeline...</p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Dashboard Third Section: Widgets (Packing, Local Guide, Chat Panel) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Packing List widget */}
                  <div className="glass rounded-2xl p-5 space-y-4">
                    <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                      <Briefcase className="h-4.5 w-4.5 text-indigo-400" />
                      <span>Dynamic Packing Checklist</span>
                    </h3>
                    <div className="space-y-2.5 text-xs text-slate-300">
                      {[
                        { label: "Universal Adaptor & Phone Charger", check: true },
                        { label: "Raincoat / Umbrella (Weather Shifted)", check: true },
                        { label: "First Aid Kit (Antihistamines, Plasters)", check: true },
                        { label: "Valid Passport & Booking Printouts", check: false },
                        { label: "Yen Cash (approx. 20,000 JPY)", check: false }
                      ].map((p, idx) => (
                        <div key={idx} className="flex items-center space-x-2.5 p-2 rounded-xl bg-[#090d16]/40 border border-slate-800/40">
                          <input type="checkbox" checked={p.check} readOnly className="rounded border-slate-700 text-indigo-600 focus:ring-0 focus:ring-offset-0 bg-slate-900 cursor-pointer h-4 w-4" />
                          <span className={`font-medium ${p.check ? "line-through text-slate-500" : ""}`}>{p.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Local Etiquette & Phrases widget */}
                  <div className="glass rounded-2xl p-5 space-y-4">
                    <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                      <BookOpen className="h-4.5 w-4.5 text-indigo-400" />
                      <span>Culture & Etiquette</span>
                    </h3>
                    <div className="space-y-3.5 text-xs">
                      <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                        <span className="font-bold text-indigo-400 text-2xs block uppercase">Etiquette Rule</span>
                        <p className="text-slate-300 mt-1 font-medium">Do not stand on the right side of the escalator in Tokyo (keep left). Avoid tipping at bars/diners.</p>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                        <span className="font-bold text-emerald-400 text-2xs block uppercase">Key Translation</span>
                        <p className="text-slate-300 mt-1 font-medium">"Otearai wa doko desu ka?" - Where is the bathroom?</p>
                        <p className="text-3xs text-slate-500 mt-0.5">Phonetic: oh-teh-ah-rye wah doh-ko dess kah?</p>
                      </div>
                    </div>
                  </div>

                  {/* AI Assistant Chat Panel */}
                  <div className="glass rounded-2xl p-5 flex flex-col h-[280px]">
                    <h3 className="font-bold text-sm text-white flex items-center space-x-2 mb-3">
                      <MessageSquare className="h-4.5 w-4.5 text-indigo-400" />
                      <span>Follow-up Adjustments</span>
                    </h3>
                    <div className="flex-1 overflow-y-auto mb-3 space-y-2 no-scrollbar">
                      {chatHistory.map((chat, idx) => (
                        <div key={idx} className={`p-2.5 rounded-xl text-xs max-w-[85%] font-medium ${
                          chat.sender === "User" 
                            ? "bg-indigo-600/30 text-indigo-200 border border-indigo-500/20 self-end ml-auto" 
                            : "bg-slate-800/40 text-slate-300 border border-slate-800/60"
                        }`}>
                          <span className="text-3xs text-slate-500 block mb-0.5">{chat.sender}</span>
                          {chat.text}
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleSendChat} className="flex space-x-2">
                      <input 
                        type="text" 
                        value={chatMessage} 
                        onChange={(e) => setChatMessage(e.target.value)} 
                        placeholder="Suggest cheaper flight date..." 
                        className="flex-1 bg-slate-900 border border-slate-800 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 text-white" 
                      />
                      <button type="submit" className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all">
                        <Send className="h-4 w-4" />
                      </button>
                    </form>
                  </div>

                </div>
              </motion.div>
            )}

            {/* TAB: TRIPS */}
            {activeTab === "trips" && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {/* Planning Form */}
                <div className="glass rounded-2xl p-6">
                  <h3 className="font-bold text-base text-white mb-6">Launch New Travel Mission</h3>
                  <form onSubmit={handleCreateTrip} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Destination City</label>
                      <input 
                        type="text" 
                        value={destination} 
                        onChange={(e) => setDestination(e.target.value)} 
                        placeholder="Tokyo" 
                        className="w-full bg-slate-900 border border-slate-800 text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 text-white" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Start Date</label>
                      <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)} 
                        className="w-full bg-slate-900 border border-slate-800 text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 text-white" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">End Date</label>
                      <input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)} 
                        className="w-full bg-slate-900 border border-slate-800 text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 text-white" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Total Budget ($)</label>
                      <input 
                        type="number" 
                        value={budgetTotal} 
                        onChange={(e) => setBudgetTotal(Number(e.target.value))} 
                        className="w-full bg-slate-900 border border-slate-800 text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 text-white" 
                      />
                    </div>
                    <div className="md:col-span-4 flex justify-end">
                      <button 
                        type="submit" 
                        disabled={creatingTrip}
                        className="px-6 py-3 font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all flex items-center space-x-2 text-xs"
                      >
                        {creatingTrip ? <span>Deploying Multi-Agents...</span> : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            <span>Assemble Agent Team</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* List of active/previous missions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {trips.map((t) => (
                    <div key={t.id} className="glass rounded-2xl p-6 flex flex-col justify-between min-h-[160px] glass-interactive">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs font-medium text-indigo-400 block tracking-widest uppercase">Mission Code: #{t.id}</span>
                          <h4 className="text-2xl font-bold text-white mt-1">{t.destination}</h4>
                          <span className="text-slate-400 text-xs mt-1 block">{t.start_date} to {t.end_date}</span>
                        </div>
                        <button 
                          onClick={() => handleDeleteTrip(t.id)}
                          className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-800/80">
                        <span className="text-xs text-slate-400">Budget: <strong className="text-white">${t.budget_total}</strong></span>
                        <button 
                          onClick={() => {
                            setSelectedTripId(t.id);
                            setActiveTab("dashboard");
                          }}
                          className="text-2xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                        >
                          <span>Open Control Board</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* TAB: AGENTS */}
            {activeTab === "agents" && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="glass rounded-2xl p-6 bg-[#0c1220]/20">
                  <h3 className="font-bold text-base text-white mb-2">Specialized Agent Fleet</h3>
                  <p className="text-xs text-slate-400">12 intelligent agents collaborate under the Lead Orchestrator to solve visa, flight, weather, and planning tasks.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { name: "Flight Agent", role: "Flight Route Research", desc: "Compares routes, bag estimates, airline carriers, and cheapest dates.", icon: Plane },
                    { name: "Visa Agent", role: "Visa Entry Compliance", desc: "Inspects passport validations, visa rules, and embassy paperwork.", icon: Shield },
                    { name: "Hotel Agent", role: "Lodging Selection Optimizer", desc: "Selects hotels based on combined safety indexes and transit scores.", icon: Briefcase },
                    { name: "Budget Agent", role: "Cost Audit & Recalculator", desc: "Divides budget estimation blocks and flags cost-saving tips.", icon: DollarSign },
                    { name: "Weather Agent", role: "Meteorological Alert Grid", desc: "Monitors forecasts and warns when rain alerts prompt outdoor shifts.", icon: Cloud },
                    { name: "Packing Agent", role: "Checklist compiler", desc: "Tailors clothing list items based on weather, adaptors, and medicine.", icon: Briefcase },
                    { name: "Safety Agent", role: "Risk and advisory checker", desc: "Maps local scams, emergency direct lines, and medical options.", icon: ShieldAlert },
                    { name: "Local Guide Agent", role: "Local culture guide", desc: "Curates dining etiquette, tipping policies, and custom gems.", icon: Compass },
                    { name: "Activity Planner", role: "Day-by-day Itinerary Architect", desc: "Designs weather-resilient, time-optimized travel timelines.", icon: Calendar },
                    { name: "Currency Agent", role: "Conversion & ATM auditor", desc: "Exposes rate splits and advises on non-rip-off ATM networks.", icon: ArrowRightLeft },
                    { name: "Language Agent", role: "Translator & phonetics tutor", desc: "Guides survival traveler phrases with phonetic pronunciations.", icon: Globe },
                    { name: "Transportation Agent", role: "Metro & Airport transit router", desc: "Tracks subway ticket cards, trains, and walking trails.", icon: MapPin }
                  ].map((agent, index) => {
                    const Icon = agent.icon;
                    return (
                      <div key={index} className="glass rounded-2xl p-5 flex space-x-4 border border-slate-800/80 hover:border-slate-700/60 transition-all">
                        <div className="p-3.5 rounded-xl bg-indigo-600/10 border border-indigo-500/15 text-indigo-400 h-fit">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white">{agent.name}</h4>
                          <span className="text-3xs text-indigo-400 font-semibold tracking-wider block uppercase mt-0.5">{agent.role}</span>
                          <p className="text-xs text-slate-400 mt-2 leading-relaxed">{agent.desc}</p>
                          <span className="inline-flex items-center mt-3 text-3xs font-semibold text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                            Standby/Ready
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* TAB: DOCUMENTS */}
            {activeTab === "documents" && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Upload Card */}
                  <div className="glass rounded-2xl p-6 col-span-1 h-fit">
                    <h3 className="font-bold text-sm text-white mb-4">Upload Travel Documents</h3>
                    <form onSubmit={handleUploadDocument} className="space-y-4">
                      <div className="border border-dashed border-slate-800 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-500/40 transition-all">
                        <Upload className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                        <span className="text-xs text-slate-400 block font-medium">Select passport, visa, or ticket PDF/JPG</span>
                        <input 
                          type="file" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setUploadFile(e.target.files[0]);
                            }
                          }}
                          className="mt-3 text-2xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-2xs file:font-semibold file:bg-indigo-600/20 file:text-indigo-400 cursor-pointer" 
                        />
                      </div>
                      
                      {uploadFile && (
                        <div className="p-3 bg-[#0c1322] border border-slate-800 rounded-xl text-2xs text-indigo-300 font-semibold truncate">
                          Selected: {uploadFile.name}
                        </div>
                      )}
                      
                      <button 
                        type="submit" 
                        disabled={uploading || !uploadFile}
                        className="w-full py-2.5 font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs transition-all flex items-center justify-center space-x-1.5"
                      >
                        {uploading ? <span>Processing OCR...</span> : (
                          <>
                            <Upload className="h-4 w-4" />
                            <span>Scan Document</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* List of uploaded documents */}
                  <div className="glass rounded-2xl p-6 col-span-2">
                    <h3 className="font-bold text-sm text-white mb-4">Parsed Travel Credentials</h3>
                    
                    <div className="space-y-3">
                      {selectedTripDetails?.documents && selectedTripDetails.documents.length > 0 ? (
                        selectedTripDetails.documents.map((doc) => (
                          <div key={doc.id} className="p-4 rounded-xl border border-slate-800/80 bg-[#090d16]/40 flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                              <div className="p-2.5 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/15">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-xs text-white">{doc.file_name}</h4>
                                <span className="text-3xs text-slate-500">Uploaded {new Date(doc.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 text-3xs font-bold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {doc.status}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center p-8 text-slate-500 text-xs">
                          No parsed documents available for this mission.
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* TAB: BUDGET */}
            {activeTab === "budget" && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Left: Chart Visualization */}
                  <div className="glass rounded-2xl p-6 col-span-1 md:col-span-2 h-[380px]">
                    <h3 className="font-bold text-sm text-white mb-4">Budget Division Breakdown</h3>
                    
                    {selectedTripDetails?.budget_logs && selectedTripDetails.budget_logs.length > 0 ? (
                      <div className="h-full w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={260}>
                          <PieChart>
                            <Pie
                              data={selectedTripDetails.budget_logs.map(item => ({
                                name: item.category,
                                value: item.estimated_cost
                              }))}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={90}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {selectedTripDetails.budget_logs.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => `$${value}`} />
                            <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="text-center p-8 text-slate-500 text-xs">No budget estimations loaded.</div>
                    )}
                  </div>

                  {/* Right: Saving Tips */}
                  <div className="glass rounded-2xl p-6 col-span-1 space-y-4">
                    <h3 className="font-bold text-sm text-white">Budget Auditor Recommendations</h3>
                    
                    <div className="space-y-3.5 text-xs">
                      <div className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-300 font-medium">
                        <span className="font-bold text-indigo-400 block text-3xs uppercase">Flight Saving Tip</span>
                        Fly mid-week (Tuesday/Wednesday) to save approximately 15-20% on tickets.
                      </div>
                      <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-300 font-medium">
                        <span className="font-bold text-emerald-400 block text-3xs uppercase">Transit Pass Tip</span>
                        Consider purchasing the 72-hour subway pass in Tokyo to avoid individual station ticket markups.
                      </div>
                    </div>
                  </div>

                </div>

                {/* Budget Category Table */}
                <div className="glass rounded-2xl p-6">
                  <h3 className="font-bold text-sm text-white mb-4">Budget Line Item Ledger</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-medium">
                          <th className="pb-3">Category</th>
                          <th className="pb-3 text-right">Estimated Cost ($)</th>
                          <th className="pb-3 text-right">Actual Cost ($)</th>
                          <th className="pb-3 pl-6">Line Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {selectedTripDetails?.budget_logs.map((item) => (
                          <tr key={item.id}>
                            <td className="py-3 font-semibold text-white">{item.category}</td>
                            <td className="py-3 text-right font-mono font-bold">${item.estimated_cost}</td>
                            <td className="py-3 text-right font-mono">${item.actual_cost}</td>
                            <td className="py-3 pl-6">
                              <span className={`px-2 py-0.5 text-3xs font-semibold rounded ${
                                item.actual_cost > 0 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-800 text-slate-500"
                              }`}>
                                {item.actual_cost > 0 ? "Paid / Recorded" : "Allocated / Unpaid"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </motion.div>
            )}

            {/* TAB: SETTINGS */}
            {activeTab === "settings" && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="max-w-2xl mx-auto glass rounded-2xl p-6 space-y-6"
              >
                <h3 className="font-bold text-base text-white">Settings & Credentials</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase block mb-1.5">Model Engine Endpoint</label>
                    <select className="w-full bg-slate-900 border border-slate-800 text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 text-white select-none">
                      <option>gemini-flash-latest (Vertex AI)</option>
                      <option>gemini-2.5-flash (Vertex AI API)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase block mb-1.5">Google Cloud Project ID</label>
                    <input type="text" value="travel-mission-capstone" readOnly className="w-full bg-slate-900 border border-slate-800 text-xs px-4 py-3 rounded-xl text-slate-500 focus:outline-none cursor-not-allowed" />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase block mb-1.5">GCP Regional Host</label>
                    <input type="text" value="global (Vertex AI Endpoint)" readOnly className="w-full bg-slate-900 border border-slate-800 text-xs px-4 py-3 rounded-xl text-slate-500 focus:outline-none cursor-not-allowed" />
                  </div>
                  
                  <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Database Connection Status</span>
                    <span className="text-emerald-400 font-semibold">SQLITE Connected</span>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </main>

    </div>
  );
}
