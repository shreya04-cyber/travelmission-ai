"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plane, Shield, ShieldAlert, DollarSign, Cloud, Calendar, Briefcase, 
  MapPin, CheckSquare, MessageSquare, BookOpen, Compass, RotateCcw, 
  AlertTriangle, Upload, HelpCircle, Settings, Trash2, Send, Activity, 
  ChevronRight, Sparkles, User, Globe, AlertCircle, FileText, ArrowRightLeft,
  ChevronDown, Menu, X, Info, Thermometer, Wind, Sun, Search, TrendingUp,
  TrendingDown, CheckCircle2, ChevronLeft, Lock
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend } from "recharts";

// Interfaces
interface Trip {
  id: number;
  destination: string;
  start_date: string;
  end_date: string;
  budget_total: number;
  currency: string;
  home_currency?: string;
  status: string;
  health_score?: number;
  active_alerts?: string;
  recommendations?: string;
  smart_notifications?: string;
}

interface ItineraryItem {
  id: number;
  day_number: number;
  time_of_day: string;
  title: string;
  description: string;
  location: string;
  cost: number;
  cost_home_currency?: number;
  agent_notes?: string;
  weather_notes?: string;
}

interface BudgetLog {
  id: number;
  category: string;
  estimated_cost: number;
  cost_home_currency?: number;
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

interface Country {
  name: string;
  code: string;
  flag: string;
  currency: string;
}

const COUNTRIES: Country[] = [
  { name: "Tokyo, Japan", code: "JP", flag: "🇯🇵", currency: "JPY" },
  { name: "Paris, France", code: "FR", flag: "🇫🇷", currency: "EUR" },
  { name: "New York, USA", code: "US", flag: "🇺🇸", currency: "USD" },
  { name: "London, UK", code: "GB", flag: "🇬🇧", currency: "GBP" },
  { name: "Delhi, India", code: "IN", flag: "🇮🇳", currency: "INR" },
  { name: "Berlin, Germany", code: "DE", flag: "🇩🇪", currency: "EUR" },
  { name: "Rome, Italy", code: "IT", flag: "🇮🇹", currency: "EUR" },
  { name: "Sydney, Australia", code: "AU", flag: "🇦🇺", currency: "AUD" },
  { name: "Toronto, Canada", code: "CA", flag: "🇨🇦", currency: "CAD" },
  { name: "Singapore", code: "SG", flag: "🇸🇬", currency: "SGD" },
  { name: "Madrid, Spain", code: "ES", flag: "🇪🇸", currency: "EUR" },
  { name: "Geneva, Switzerland", code: "CH", flag: "🇨🇭", currency: "CHF" },
  { name: "Bangkok, Thailand", code: "TH", flag: "🇹🇭", currency: "THB" },
  { name: "Seoul, South Korea", code: "KR", flag: "🇰🇷", currency: "KRW" },
  { name: "Beijing, China", code: "CN", flag: "🇨🇳", currency: "CNY" },
  { name: "Dubai, UAE", code: "AE", flag: "🇦🇪", currency: "AED" },
  { name: "Amsterdam, Netherlands", code: "NL", flag: "🇳🇱", currency: "EUR" },
  { name: "Cape Town, South Africa", code: "ZA", flag: "🇿🇦", currency: "ZAR" },
  { name: "Rio de Janeiro, Brazil", code: "BR", flag: "🇧🇷", currency: "BRL" },
  { name: "Mexico City, Mexico", code: "MX", flag: "🇲🇽", currency: "MXN" }
];

const COLORS = ["#6366f1", "#10b981", "#f43f5e", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899"];

export default function MissionControlDashboard() {
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [showArchModal, setShowArchModal] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [selectedTripDetails, setSelectedTripDetails] = useState<TripDetail | null>(null);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [websocketActive, setWebsocketActive] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  
  // Trip creation state
  const [destination, setDestination] = useState<string>("");
  const [showCountryDropdown, setShowCountryDropdown] = useState<boolean>(false);
  const [countrySearch, setCountrySearch] = useState<string>("");
  
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [budgetTotal, setBudgetTotal] = useState<number>(2000);
  const [homeCurrency, setHomeCurrency] = useState<string>("USD");
  const [destCurrency, setDestCurrency] = useState<string>("EUR");
  const [creatingTrip, setCreatingTrip] = useState<boolean>(false);
  const [currencyRates, setCurrencyRates] = useState<any>(null);
  const [loadingRates, setLoadingRates] = useState<boolean>(false);
  const [showBudgetInHome, setShowBudgetInHome] = useState<boolean>(false);

  // Currency Converter Custom State
  const [convertAmount, setConvertAmount] = useState<number>(100);
  const [convertFrom, setConvertFrom] = useState<string>("USD");
  const [convertTo, setConvertTo] = useState<string>("EUR");
  const [showFromList, setShowFromList] = useState<boolean>(false);
  const [showToList, setShowToList] = useState<boolean>(false);

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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    fetchTrips();
  }, []);

  // Glowing Earth Landing Canvas
  useEffect(() => {
    if (!showLanding || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 500;
      canvas.height = canvas.parentElement?.clientHeight || 500;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const r = Math.min(cx, cy) * 0.6;

      // Glow backing
      const glow = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 1.5);
      glow.addColorStop(0, "rgba(99, 102, 241, 0.15)");
      glow.addColorStop(0.5, "rgba(99, 102, 241, 0.05)");
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Earth body
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = "#0c1324";
      ctx.strokeStyle = "rgba(99, 102, 241, 0.4)";
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();

      // Rotating grid lines
      angle += 0.003;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      // Latitudes
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        const yVal = (r * i) / 4;
        const rad = Math.sqrt(r * r - yVal * yVal);
        ctx.ellipse(0, yVal, rad, rad * 0.25, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(99, 102, 241, 0.15)";
        ctx.stroke();
      }

      // Longitudes
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * Math.sin((i * Math.PI) / 4), 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(99, 102, 241, 0.15)";
        ctx.stroke();
      }
      ctx.restore();

      // Route lines connecting global nodes
      const points = [
        { x: cx - r * 0.5, y: cy - r * 0.3, label: "SFO" },
        { x: cx + r * 0.6, y: cy - r * 0.1, label: "HND" },
        { x: cx - r * 0.1, y: cy + r * 0.5, label: "CDG" },
        { x: cx + r * 0.2, y: cy - r * 0.5, label: "LHR" }
      ];

      points.forEach((p, idx) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#10b981";
        ctx.shadowColor = "#10b981";
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0; // reset

        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.font = "10px sans-serif";
        ctx.fillText(p.label, p.x + 8, p.y + 3);

        // Arc connections
        const next = points[(idx + 1) % points.length];
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.quadraticCurveTo((p.x + next.x) / 2, (p.y + next.y) / 2 - 40, next.x, next.y);
        ctx.strokeStyle = "rgba(99, 102, 241, 0.35)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      animationFrameId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [showLanding]);

  // Helper to format currency values safely
  const formatCurrency = (val: number, cur: string) => {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: cur.toUpperCase(),
      }).format(val);
    } catch {
      return `${cur.toUpperCase()} ${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    }
  };

  const fetchCurrencyRates = async (home: string, dest: string) => {
    setLoadingRates(true);
    try {
      const res = await fetch(
        `http://localhost:8000/api/currency/rates?from_currency=${home}&to_currency=${dest}`
      );
      if (res.ok) {
        const data = await res.json();
        setCurrencyRates(data);
      }
    } catch (err) {
      console.error("Rates fetch error: ", err);
    } finally {
      setLoadingRates(false);
    }
  };

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
        const mockTrips: Trip[] = [
          { id: 1, destination: "Tokyo, Japan", start_date: "2026-10-15", end_date: "2026-10-20", budget_total: 3000, currency: "USD", status: "Active", health_score: 95 },
          { id: 2, destination: "Paris, France", start_date: "2026-12-01", end_date: "2026-12-06", budget_total: 2500, currency: "USD", status: "Planning", health_score: 85 }
        ];
        setTrips(mockTrips);
        setSelectedTripId(1);
      }
    } catch (e) {
      console.log("Using Mock Fallbacks (Backend not running)");
      const mockTrips: Trip[] = [
        { id: 1, destination: "Tokyo, Japan", start_date: "2026-10-15", end_date: "2026-10-20", budget_total: 3000, currency: "USD", status: "Active", health_score: 95 },
        { id: 2, destination: "Paris, France", start_date: "2026-12-01", end_date: "2026-12-06", budget_total: 2500, currency: "USD", status: "Planning", health_score: 85 }
      ];
      setTrips(mockTrips);
      setSelectedTripId(1);
    }
  };

  // Fetch details of selected trip
  useEffect(() => {
    if (!selectedTripId) return;
    connectWebSocket(selectedTripId);
    fetchTripDetails(selectedTripId);
  }, [selectedTripId]);

  const fetchTripDetails = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/trips/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedTripDetails(data);
        fetchCurrencyRates(data.home_currency || "USD", data.currency || "EUR");
      } else {
        generateMockDetails(id);
      }
    } catch (e) {
      generateMockDetails(id);
    }
  };

  const generateMockDetails = (id: number) => {
    const isTokyo = id === 1 || (trips.find(t => t.id === id)?.destination.toLowerCase().includes("tokyo"));
    
    const details: TripDetail = {
      id: id,
      destination: isTokyo ? "Tokyo, Japan" : "Paris, France",
      start_date: isTokyo ? "2026-10-15" : "2026-12-01",
      end_date: isTokyo ? "2026-10-20" : "2026-12-06",
      budget_total: isTokyo ? 3000 : 2500,
      currency: "USD",
      status: isTokyo ? "Active" : "Planning",
      health_score: isTokyo ? 95 : 85,
      active_alerts: JSON.stringify(["Day 2 heavy rain warning. Shifted to indoor alternatives."]),
      recommendations: JSON.stringify(["Rebook flight via SFO direct route to save $80."]),
      smart_notifications: JSON.stringify(["Your flight is now $80 cheaper."]),
      documents: [
        { id: 101, file_name: "Passport_JohnDoe.pdf", file_type: "application/pdf", status: "Parsed", created_at: "2026-07-05T10:00:00Z" }
      ],
      budget_logs: [
        { id: 201, category: "Flight", estimated_cost: isTokyo ? 870 : 800, actual_cost: 870 },
        { id: 202, category: "Hotel", estimated_cost: isTokyo ? 1100 : 900, actual_cost: 0 },
        { id: 203, category: "Food", estimated_cost: 300, actual_cost: 0 },
        { id: 204, category: "Transportation", estimated_cost: 165, actual_cost: 0 },
        { id: 205, category: "Shopping", estimated_cost: 200, actual_cost: 0 },
        { id: 206, category: "Insurance", estimated_cost: 100, actual_cost: 100 },
        { id: 207, category: "Emergency Fund", estimated_cost: 200, actual_cost: 0 }
      ],
      itinerary_items: isTokyo ? [
        { id: 301, day_number: 1, time_of_day: "Morning", title: "Arrival & Late Check-in (Delayed)", description: "Flight delayed by 3 hours. Take airport transfer directly.", location: "Haneda Airport", cost: 0, agent_notes: "Visa Agent: US Citizens visa-free entry validated." },
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

  const handleTriggerSimulation = async (scenario: string) => {
    if (!selectedTripId) return;
    try {
      await fetch(`http://localhost:8000/api/trips/${selectedTripId}/simulate?scenario=${scenario}`, {
        method: "POST"
      });
      fetchTripDetails(selectedTripId);
    } catch (err) {
      console.error("Simulation failed:", err);
    }
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
      if (data.message === "Trip details synchronized successfully.") {
        fetchTripDetails(tripId);
      }
    };

    ws.onclose = () => {
      setWebsocketActive(false);
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
          currency: destCurrency,
          home_currency: homeCurrency
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTrips((prev) => [data, ...prev]);
        setSelectedTripId(data.id);
        setDestination("");
        setCountrySearch("");
        setActiveTab("dashboard");
      }
    } catch (err) {
      // Mock local addition
      const mockId = Date.now();
      const mockNew: Trip = {
        id: mockId,
        destination,
        start_date: startDate,
        end_date: endDate,
        budget_total: budgetTotal,
        currency: destCurrency,
        home_currency: homeCurrency,
        status: "Planning",
        health_score: 100
      };
      setTrips((prev) => [mockNew, ...prev]);
      setSelectedTripId(mockId);
      setDestination("");
      setCountrySearch("");
      setActiveTab("dashboard");
    } finally {
      setCreatingTrip(false);
    }
  };

  const handleDeleteTrip = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/trips/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setTrips((prev) => prev.filter(t => t.id !== id));
        if (selectedTripId === id) {
          setSelectedTripId(null);
          setSelectedTripDetails(null);
        }
      }
    } catch {
      setTrips((prev) => prev.filter(t => t.id !== id));
      if (selectedTripId === id) {
        setSelectedTripId(null);
        setSelectedTripDetails(null);
      }
    }
  };

  // Drag and Drop File Parser Handler
  const handleFileUpload = async (e: React.FormEvent) => {
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
        fetchTripDetails(selectedTripId);
        setUploadFile(null);
      }
    } catch {
      setTimeout(() => {
        if (selectedTripDetails) {
          const newDoc = {
            id: Date.now(),
            file_name: uploadFile.name,
            file_type: uploadFile.type || "application/octet-stream",
            status: "Parsed",
            created_at: new Date().toISOString()
          };
          setSelectedTripDetails({
            ...selectedTripDetails,
            documents: [...selectedTripDetails.documents, newDoc]
          });
        }
        setUploadFile(null);
        setUploading(false);
      }, 1550);
    } finally {
      setUploading(false);
    }
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

  // Autocomplete country match
  const filteredCountries = countrySearch 
    ? COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()))
    : COUNTRIES;

  const mockWeeklyTrend = [
    { day: "Wk 1", rate: 1.07 },
    { day: "Wk 2", rate: 1.09 },
    { day: "Wk 3", rate: 1.08 },
    { day: "Wk 4", rate: 1.11 }
  ];

  if (!isMounted) return null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#080c14] text-slate-100 antialiased font-sans">
      
      {/* GLOW BACKGROUND EFFECT */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-3xl"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-3xl"></div>
      </div>

      {/* FULL SCREEN Futuristic Landing Page */}
      <AnimatePresence>
        {showLanding && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-0 bg-[#080c14] z-50 overflow-y-auto flex flex-col justify-between"
          >
            {/* Header */}
            <div className="max-w-7xl mx-auto w-full px-6 py-6 flex justify-between items-center relative z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
                  <Compass className="h-6 w-6 animate-pulse" />
                </div>
                <span className="font-extrabold text-xl tracking-wider text-white">TravelMission AI</span>
              </div>
              <button 
                onClick={() => setShowLanding(false)}
                className="px-5 py-2.5 rounded-xl border border-indigo-500/30 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 font-semibold text-xs transition-all tracking-wider shadow-lg shadow-indigo-600/10 cursor-pointer"
              >
                Access Dashboard
              </button>
            </div>

            {/* Body */}
            <div className="max-w-7xl mx-auto w-full px-6 flex-1 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10 py-12">
              <div className="space-y-8 max-w-xl">
                <span className="px-3 py-1 text-2xs font-extrabold bg-indigo-600/10 text-indigo-300 border border-indigo-500/20 rounded-full uppercase tracking-widest">
                  Powered by Gemini 2.5 & Google ADK
                </span>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] mt-2">
                  AI Travel <br />
                  <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-500 bg-clip-text text-transparent">Mission Control</span>
                </h1>

                <p className="text-base text-slate-400 leading-relaxed">
                  One Mission. 12 Specialized AI Agents. Infinite Adventures. Monitor flights, budgets, weather, security sentry logs, and country document audits simultaneously.
                </p>

                <div className="flex flex-wrap gap-4 pt-4">
                  <button 
                    onClick={() => setShowLanding(false)}
                    className="h-12 px-8 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center space-x-2 cursor-pointer"
                  >
                    <span>Start Planning</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  
                  <button 
                    onClick={() => setShowArchModal(true)}
                    className="h-12 px-8 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 font-bold text-sm tracking-wide transition-all flex items-center space-x-2 cursor-pointer"
                  >
                    <span>Explore Architecture</span>
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                  </button>
                </div>
              </div>

              {/* Glowing Canvas Globe */}
              <div className="w-full h-[300px] lg:h-[500px] relative flex items-center justify-center">
                <canvas ref={canvasRef} className="absolute z-0 w-full h-full max-w-[450px] max-h-[450px]" />
                
                {/* Floating travel cards overlay */}
                <div className="absolute top-10 left-5 glass rounded-xl p-3 shadow-2xl border-indigo-500/20 flex items-center space-x-3 animate-bounce" style={{ animationDuration: "5s" }}>
                  <Plane className="h-5 w-5 text-indigo-400" />
                  <div className="text-left">
                    <span className="text-3xs text-slate-500 uppercase font-bold">Flight Agent</span>
                    <p className="text-2xs text-white font-semibold">SFO to HND Optimized</p>
                  </div>
                </div>

                <div className="absolute bottom-16 right-5 glass rounded-xl p-3 shadow-2xl border-emerald-500/20 flex items-center space-x-3 animate-bounce" style={{ animationDuration: "7s" }}>
                  <Cloud className="h-5 w-5 text-emerald-400" />
                  <div className="text-left">
                    <span className="text-3xs text-slate-500 uppercase font-bold">Weather Agent</span>
                    <p className="text-2xs text-white font-semibold">Checks Clear Skies</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="max-w-7xl mx-auto w-full px-6 py-6 border-t border-slate-800/80 text-center text-xs text-slate-500 relative z-10">
              © 2026 TravelMission AI Corp. Built for Kaggle AI Agents Capstone.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ARCHITECTURE MODAL */}
      <AnimatePresence>
        {showArchModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0b0f19] border border-slate-800 rounded-2xl w-full max-w-4xl p-6 relative overflow-hidden"
            >
              <button 
                onClick={() => setShowArchModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>

              <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                <Globe className="h-5 w-5 text-indigo-400" />
                <span>Multi-Agent System Architecture</span>
              </h3>

              <p className="text-xs text-slate-400 mb-6">
                TravelMission AI is powered by a hierarchical model orchestration setup. Below is the operational data flow:
              </p>

              {/* Node Flow mockup */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center text-xs font-bold font-mono">
                <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-300">
                  <span className="block text-2xs text-slate-500 mb-1">INTERFACE</span>
                  React Frontend
                </div>
                <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-300">
                  <span className="block text-2xs text-slate-500 mb-1">ROUTING</span>
                  FastAPI Backend
                </div>
                <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-300">
                  <span className="block text-2xs text-slate-500 mb-1">COORDINATION</span>
                  Lead Orchestrator
                </div>
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-300">
                  <span className="block text-2xs text-slate-500 mb-1">EXECUTION</span>
                  12 Agent Fleet
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-slate-900 border border-slate-800 text-2xs text-slate-300 space-y-2 leading-relaxed">
                <p>💡 <strong>Lead Orchestrator</strong>: Synthesizes input requests, validates security bounds, and issues task tokens.</p>
                <p>🛠️ <strong>MCP Sandboxing</strong>: Standardizes tool declarations for Browsers, Google Maps, and Local File systems using isolated environments.</p>
                <p>🗄️ <strong>SQLite Ledger</strong>: Guarantees complete execution logging and persists generated itineraries, budgets, and document tokens.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE HEADER BAR */}
      <header className="md:hidden fixed top-0 left-0 w-full h-16 border-b border-slate-800 bg-[#080c14]/90 backdrop-blur-md z-40 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Compass className="h-5 w-5 text-indigo-400" />
          <span className="font-extrabold text-sm text-white uppercase tracking-wider">TravelMission</span>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg border border-slate-800 text-slate-300 hover:text-white"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 w-64 border-r border-slate-800 bg-[#0c1220]/95 p-6 flex flex-col justify-between z-40 transform transition-transform duration-300 md:translate-x-0 md:static ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div>
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-2.5 rounded-xl bg-indigo-600/30 border border-indigo-500/30 text-indigo-400">
              <Compass className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-wider text-white">TravelMission</h1>
              <p className="text-xs text-indigo-400 font-medium">Operations Center</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            {[
              { id: "dashboard", label: "Mission Board", icon: Briefcase },
              { id: "trips", label: "All Missions", icon: MapPin },
              { id: "agents", label: "Agent Hub", icon: Sparkles },
              { id: "documents", label: "Documents", icon: FileText },
              { id: "budget", label: "Budget Log", icon: DollarSign },
              { id: "currency", label: "Currency Intel", icon: ArrowRightLeft },
              { id: "settings", label: "Settings", icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false); // Close sidebar on mobile
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all min-h-[44px] cursor-pointer ${
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
        <div className="p-4 rounded-2xl glass border-slate-800 flex items-center space-x-3 mt-auto">
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
      <main className="flex-1 flex flex-col overflow-hidden pt-16 md:pt-0 z-10">
        
        {/* TOP NAV BAR */}
        <header className="hidden md:flex h-20 border-b border-slate-800/80 px-8 items-center justify-between bg-[#080c14]/50 backdrop-blur-md">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold tracking-tight text-white capitalize">{activeTab === "dashboard" ? "Mission Control" : activeTab} Panel</h2>
            
            {/* Trip Selector Dropdown */}
            {trips.length > 0 && (
              <div className="relative">
                <select 
                  value={selectedTripId || ""}
                  onChange={(e) => setSelectedTripId(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-800 text-xs px-3.5 py-1.5 pr-8 rounded-xl focus:outline-none focus:border-indigo-500 text-white font-semibold cursor-pointer appearance-none"
                >
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.destination} ({t.start_date.split("-")[0]})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            )}
          </div>

          {/* Quick Connection Indicator */}
          <div className="flex items-center space-x-2">
            <span className={`h-2 w-2 rounded-full ${websocketActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}></span>
            <span className="text-xs font-semibold text-slate-400">{websocketActive ? "Live Feed Sync" : "No Feed Sync"}</span>
          </div>
        </header>

        {/* CONTAINER VIEWPORTS */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar bg-[#080c14]/40">
          
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
                {/* AI TRAVEL CONTROL ROOM (FLAGSHIP FEATURE) */}
                <div className="glass rounded-2xl p-6 border border-indigo-500/20 bg-gradient-to-br from-[#0c1324] to-[#080d19]/80 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center pb-6 border-b border-slate-800/80 mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                        <Shield className="h-5 w-5 text-indigo-400" />
                        <span>AI Mission Control Center</span>
                        <span className="text-3xs bg-indigo-600/20 text-indigo-300 font-bold px-2 py-0.5 rounded border border-indigo-500/20 uppercase tracking-widest">Active Monitoring</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Autonomous multi-agent orchestration grid. Trigger simulations below to observe real-time collaboration.</p>
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-4 lg:mt-0">
                      <div className="text-right">
                        <span className="text-slate-500 text-3xs uppercase tracking-wider block font-bold">Trip Health Score</span>
                        <span className="text-xs text-slate-400 font-semibold block">Based on 9 validation vectors</span>
                      </div>
                      <div className="relative h-16 w-16 flex items-center justify-center rounded-full bg-slate-900/60 border-2 border-slate-800 shadow-inner">
                        <div className={`absolute inset-0 rounded-full border-2 ${
                          (selectedTripDetails?.health_score || 100) >= 80 ? "border-emerald-500/30" :
                          (selectedTripDetails?.health_score || 100) >= 50 ? "border-amber-500/30" : "border-rose-500/30"
                        }`}></div>
                        <span className={`text-xl font-black font-mono ${
                          (selectedTripDetails?.health_score || 100) >= 80 ? "text-emerald-400" :
                          (selectedTripDetails?.health_score || 100) >= 50 ? "text-amber-400" : "text-rose-400 animate-pulse"
                        }`}>
                          {selectedTripDetails?.health_score || 100}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Active Alerts & Advice */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                        <ShieldAlert className="h-4 w-4 text-rose-500" />
                        <span>Active Sentry Alerts & Advice</span>
                      </h4>
                      <div className="space-y-2.5 h-[160px] overflow-y-auto no-scrollbar">
                        {selectedTripDetails?.active_alerts && JSON.parse(selectedTripDetails.active_alerts).length > 0 ? (
                          JSON.parse(selectedTripDetails.active_alerts).map((alert: string, idx: number) => (
                            <div key={idx} className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-300 text-2xs font-semibold leading-relaxed flex items-start space-x-2">
                              <span className="mt-0.5">⚠️</span>
                              <span>{alert}</span>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-center rounded-xl border border-slate-800 bg-slate-900/40 text-slate-500 text-2xs italic">
                            No critical alerts active. System checks green.
                          </div>
                        )}
                        {selectedTripDetails?.recommendations && JSON.parse(selectedTripDetails.recommendations).length > 0 && (
                          JSON.parse(selectedTripDetails.recommendations).map((rec: string, idx: number) => (
                            <div key={idx} className="p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-300 text-2xs font-semibold leading-relaxed flex items-start space-x-2">
                              <span className="mt-0.5">💡</span>
                              <span>{rec}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    
                    {/* Smart Notifications Hub */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                        <MessageSquare className="h-4 w-4 text-indigo-400" />
                        <span>Smart Notification Hub</span>
                      </h4>
                      <div className="space-y-2 h-[160px] overflow-y-auto no-scrollbar">
                        {selectedTripDetails?.smart_notifications && JSON.parse(selectedTripDetails.smart_notifications).length > 0 ? (
                          JSON.parse(selectedTripDetails.smart_notifications).map((notif: string, idx: number) => (
                            <div key={idx} className="p-3 rounded-xl border border-slate-800 bg-[#090d16]/80 text-slate-300 text-2xs font-semibold leading-relaxed shadow-sm">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-3xs text-indigo-400 uppercase tracking-widest font-bold">System Broadcast</span>
                                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                              </div>
                              {notif}
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-center rounded-xl border border-slate-800 bg-slate-900/40 text-slate-500 text-2xs italic">
                            Waiting for real-time broadcasts...
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Active Agent Grid Status */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                        <Globe className="h-4 w-4 text-emerald-400" />
                        <span>Active Agent Grid Status</span>
                      </h4>
                      <div className="grid grid-cols-3 gap-2 text-3xs font-bold text-center">
                        {[
                          { name: "Flight", status: selectedTripDetails?.status === "Active" ? "Active" : "Idle", color: selectedTripDetails?.status === "Active" ? "text-emerald-400" : "text-slate-500" },
                          { name: "Visa", status: selectedTripDetails?.status === "Active" ? "Active" : "Idle", color: selectedTripDetails?.status === "Active" ? "text-emerald-400" : "text-slate-500" },
                          { name: "Hotel", status: selectedTripDetails?.status === "Active" ? "Active" : "Idle", color: selectedTripDetails?.status === "Active" ? "text-emerald-400" : "text-slate-500" },
                          { name: "Budget", status: selectedTripDetails?.status === "Active" ? "Active" : "Idle", color: selectedTripDetails?.status === "Active" ? "text-emerald-400" : "text-slate-500" },
                          { name: "Weather", status: selectedTripDetails?.status === "Active" ? "Active" : "Idle", color: selectedTripDetails?.status === "Active" ? "text-emerald-400" : "text-slate-500" },
                          { name: "Safety", status: selectedTripDetails?.status === "Active" ? "Active" : "Idle", color: selectedTripDetails?.status === "Active" ? "text-emerald-400" : "text-slate-500" },
                          { name: "Packing", status: selectedTripDetails?.status === "Active" ? "Active" : "Idle", color: selectedTripDetails?.status === "Active" ? "text-emerald-400" : "text-slate-500" },
                          { name: "Guide", status: selectedTripDetails?.status === "Active" ? "Active" : "Idle", color: selectedTripDetails?.status === "Active" ? "text-emerald-400" : "text-slate-500" },
                          { name: "Activity", status: selectedTripDetails?.status === "Active" ? "Active" : "Idle", color: selectedTripDetails?.status === "Active" ? "text-emerald-400" : "text-slate-500" },
                          { name: "Currency", status: selectedTripDetails?.status === "Active" ? "Active" : "Idle", color: selectedTripDetails?.status === "Active" ? "text-indigo-400" : "text-slate-500" },
                          { name: "Language", status: selectedTripDetails?.status === "Active" ? "Active" : "Idle", color: selectedTripDetails?.status === "Active" ? "text-emerald-400" : "text-slate-500" },
                          { name: "Transit", status: selectedTripDetails?.status === "Active" ? "Active" : "Idle", color: selectedTripDetails?.status === "Active" ? "text-emerald-400" : "text-slate-500" }
                        ].map((ag, idx) => (
                          <div key={idx} className="p-2 rounded-lg border border-slate-800/80 bg-[#090d16]/40 flex flex-col justify-between">
                            <span className="text-slate-300 block mb-0.5 truncate">{ag.name}</span>
                            <span className={`text-4xs ${ag.color} block font-extrabold uppercase tracking-widest`}>{ag.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Simulation triggers controller */}
                  <div className="mt-6 pt-5 border-t border-slate-800/80">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">Trigger Reactive Collaboration:</span>
                    <div className="flex flex-wrap gap-2.5">
                      {[
                        { id: "flight_price_drop", label: "✈️ Flight Price Drop", color: "hover:border-emerald-500/50 hover:bg-emerald-500/5" },
                        { id: "heavy_rain", label: "🌧️ Heavy Rain Alert", color: "hover:border-indigo-500/50 hover:bg-indigo-500/5" },
                        { id: "flight_delay", label: "⏳ SFO-HND Flight Delay", color: "hover:border-amber-500/50 hover:bg-amber-500/5" },
                        { id: "passport_issue", label: "🛂 Visa Passport Expiry", color: "hover:border-rose-500/50 hover:bg-rose-500/5" },
                        { id: "overspending", label: "💳 Budget Overspending", color: "hover:border-yellow-500/50 hover:bg-yellow-500/5" },
                        { id: "unsafe_weather", label: "🌪️ Severe Storm Sentry", color: "hover:border-rose-500/50 hover:bg-rose-500/5" },
                        { id: "currency_fluctuation", label: "📈 FX Fluctuation", color: "hover:border-emerald-500/50 hover:bg-emerald-500/5" }
                      ].map((scen, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleTriggerSimulation(scen.id)}
                          className="px-3 py-2 text-3xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 rounded-xl transition-all shadow-sm min-h-[44px] cursor-pointer"
                        >
                          {scen.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

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
                          <span className="font-semibold text-white text-sm">
                            {selectedTripDetails ? (
                              <>
                                {formatCurrency(selectedTripDetails.budget_total, selectedTripDetails.currency)}
                                {selectedTripDetails.home_currency !== selectedTripDetails.currency && (
                                  <span className="text-slate-400 text-xs font-normal ml-2">
                                    ({formatCurrency(
                                      selectedTripDetails.budget_logs?.reduce((acc, curr) => acc + (curr.cost_home_currency || curr.estimated_cost), 0) || selectedTripDetails.budget_total,
                                      selectedTripDetails.home_currency || "USD"
                                    )})
                                  </span>
                                )}
                              </>
                            ) : "$0"}
                          </span>
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
                  <div className="col-span-1 glass rounded-2xl p-6 flex flex-col justify-between min-h-[160px]">
                    <div>
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Sentry Weather</span>
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          <h4 className="text-3xl font-extrabold text-white">
                            {selectedTripDetails?.destination.toLowerCase().includes("tokyo") ? "18°C" : "11°C"}
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">Heavy Rain Threat (Day 2)</p>
                        </div>
                        <Cloud className="h-10 w-10 text-indigo-400" />
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-800 text-2xs text-slate-400">
                      💡 Shifting outdoor itineraries to indoor museums
                    </div>
                  </div>

                  {/* Safety & Advisory */}
                  <div className="col-span-1 glass rounded-2xl p-6 flex flex-col justify-between min-h-[160px]">
                    <div>
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Security Clearance</span>
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          <h4 className="text-lg font-bold text-emerald-400">Level 1 (Safe)</h4>
                          <p className="text-xs text-slate-400 mt-0.5">Normal Precautions</p>
                        </div>
                        <Shield className="h-8 w-8 text-emerald-400" />
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-800 text-2xs text-slate-400 flex justify-between">
                      <span>Advisory Verified</span>
                      <span className="text-slate-500">100% Secure</span>
                    </div>
                  </div>

                </div>

                {/* Bottom Timeline & Chat Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Col: Live Agent Activity console */}
                  <div className="col-span-1 lg:col-span-2 glass rounded-2xl p-6 flex flex-col justify-between min-h-[420px]">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-sm text-white flex items-center">
                          <Activity className="h-4.5 w-4.5 mr-2 text-indigo-400" />
                          <span>Live Agent Collaboration Feed</span>
                        </h3>
                        <span className="text-3xs bg-emerald-500/10 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                          {agentLogs.length} Events Logged
                        </span>
                      </div>
                      
                      <div className="bg-slate-955/80 border border-slate-900 rounded-xl p-4 h-[300px] overflow-y-auto font-mono text-2xs space-y-3 no-scrollbar shadow-inner">
                        {agentLogs.map((log, idx) => (
                          <div key={idx} className="border-b border-slate-900 pb-2 last:border-0">
                            <span className="text-indigo-400 font-bold">[{log.agent}]</span>{" "}
                            <span className={`px-1.5 py-0.25 text-3xs font-extrabold rounded mr-1.5 ${
                              log.type === "Thought" ? "bg-slate-800 text-slate-400" :
                              log.type === "ToolCall" ? "bg-amber-500/10 text-amber-300 border border-amber-500/20" :
                              "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                            }`}>
                              {log.type}
                            </span>
                            <span className="text-slate-300">{log.message}</span>
                          </div>
                        ))}
                        <div ref={activityEndRef} />
                      </div>
                    </div>
                  </div>

                  {/* Right Col: Orchestrator Chat helper */}
                  <div className="glass rounded-2xl p-6 flex flex-col justify-between min-h-[420px]">
                    <div>
                      <h3 className="font-bold text-sm text-white mb-4 flex items-center">
                        <Sparkles className="h-4.5 w-4.5 mr-2 text-indigo-400" />
                        <span>Lead Orchestrator Pilot</span>
                      </h3>
                      
                      <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1 no-scrollbar text-xs">
                        {chatHistory.map((h, idx) => (
                          <div key={idx} className={`p-3 rounded-xl max-w-[85%] ${
                            h.sender === "User" 
                              ? "bg-indigo-600/10 text-indigo-200 border border-indigo-500/20 ml-auto" 
                              : "bg-slate-900/60 text-slate-300 border border-slate-800 mr-auto"
                          }`}>
                            <span className="block text-3xs uppercase tracking-wider font-bold text-slate-500 mb-1">{h.sender}</span>
                            {h.text}
                          </div>
                        ))}
                      </div>
                    </div>

                    <form onSubmit={handleSendChat} className="flex mt-4 items-center space-x-2 pt-4 border-t border-slate-800">
                      <input 
                        type="text" 
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        placeholder="Request flight shuffles, weather safety edits..."
                        className="flex-1 bg-slate-950 border border-slate-900 text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 text-white min-h-[44px]"
                      />
                      <button type="submit" className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md min-h-[44px] cursor-pointer">
                        <Send className="h-4 w-4" />
                      </button>
                    </form>
                  </div>

                </div>
              </motion.div>
            )}

            {/* TAB: ALL MISSIONS */}
            {activeTab === "trips" && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {/* Searchable Autocomplete Country Planner */}
                <div className="glass rounded-2xl p-6 relative">
                  <h3 className="font-bold text-base text-white mb-6">Launch New Travel Mission</h3>
                  <form onSubmit={handleCreateTrip} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    
                    {/* Searchable dropdown input */}
                    <div className="relative">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Destination City & Country</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="Search e.g. Tokyo" 
                          value={countrySearch}
                          onChange={(e) => {
                            setCountrySearch(e.target.value);
                            setShowCountryDropdown(true);
                          }}
                          onFocus={() => setShowCountryDropdown(true)}
                          className="w-full bg-slate-950 border border-slate-900 text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 text-white min-h-[44px]" 
                        />
                        <Search className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-500" />
                      </div>

                      {/* Dropdown popup */}
                      <AnimatePresence>
                        {showCountryDropdown && (
                          <motion.div 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute left-0 w-full mt-2 bg-[#0b0f19] border border-slate-800 rounded-xl max-h-[180px] overflow-y-auto z-30 shadow-2xl no-scrollbar"
                          >
                            {filteredCountries.length > 0 ? (
                              filteredCountries.map((c, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setDestination(c.name);
                                    setCountrySearch(`${c.flag} ${c.name}`);
                                    setDestCurrency(c.currency);
                                    setShowCountryDropdown(false);
                                  }}
                                  className="w-full text-left px-4 py-3 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white flex items-center space-x-2 min-h-[44px] cursor-pointer"
                                >
                                  <span>{c.flag}</span>
                                  <span>{c.name} ({c.code})</span>
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-2xs text-slate-500 italic">No matching countries.</div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Start Date</label>
                      <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)} 
                        className="w-full bg-slate-955 border border-slate-900 text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 text-white min-h-[44px]" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">End Date</label>
                      <input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)} 
                        className="w-full bg-slate-955 border border-slate-900 text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 text-white min-h-[44px]" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Total Budget</label>
                      <input 
                        type="number" 
                        value={budgetTotal} 
                        onChange={(e) => setBudgetTotal(Number(e.target.value))} 
                        className="w-full bg-slate-955 border border-slate-900 text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 text-white min-h-[44px]" 
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={creatingTrip}
                      className="w-full h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold tracking-wider transition-all flex items-center justify-center space-x-2 shadow-md cursor-pointer"
                    >
                      <Plane className="h-4 w-4" />
                      <span>{creatingTrip ? "Launching..." : "Deploy Fleet"}</span>
                    </button>
                  </form>
                </div>

                {/* Missions List */}
                <div className="space-y-4">
                  <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-wider">Active Missions Ledger</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trips.map((t) => (
                      <div key={t.id} className="glass rounded-2xl p-6 border-slate-800 flex flex-col justify-between min-h-[180px]">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="font-extrabold text-base text-white">{t.destination}</h4>
                            <span className="px-2 py-0.5 text-3xs font-semibold rounded bg-indigo-600/20 text-indigo-300 border border-indigo-500/20 uppercase tracking-widest">
                              {t.status}
                            </span>
                          </div>
                          <p className="text-slate-400 text-xs mt-2 flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                            {t.start_date} to {t.end_date}
                          </p>
                          <p className="text-slate-300 text-xs mt-2 font-semibold">
                            Est. Budget: {formatCurrency(t.budget_total, t.currency)}
                          </p>
                        </div>

                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-800/80">
                          <button 
                            onClick={() => setSelectedTripId(t.id)}
                            className="text-indigo-400 text-xs font-bold flex items-center hover:text-indigo-300 min-h-[44px] cursor-pointer"
                          >
                            <span>Open Controls</span>
                            <ChevronRight className="h-3.5 w-3.5 ml-1" />
                          </button>
                          
                          <button 
                            onClick={() => handleDeleteTrip(t.id)}
                            className="p-2 text-rose-500 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg transition-all min-h-[44px] cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
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
                <div className="flex justify-between items-center pb-4 border-b border-slate-800/80">
                  <div>
                    <h3 className="font-extrabold text-lg text-white">Specialized AI Agent Grid</h3>
                    <p className="text-slate-400 text-xs mt-1">12 dedicated agents operating concurrently via the Google Agent Development Kit (ADK).</p>
                  </div>
                  <span className="px-3 py-1 text-2xs font-extrabold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full uppercase tracking-widest animate-pulse">
                    Orchestrator Online
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { name: "Flight Agent", icon: Plane, desc: "Queries global airline directories. Optimizes routes and captures price drops.", tools: "Browser, Flight API", speed: "140ms" },
                    { name: "Weather Agent", icon: Cloud, desc: "Monitors global meteorology forecasts. Triggers warnings for outdoor agenda shifts.", tools: "Weather API", speed: "210ms" },
                    { name: "Visa Agent", icon: Shield, desc: "Validates visa policies and reviews uploaded passports for expiry dates.", tools: "Filesystem MCP", speed: "180ms" },
                    { name: "Hotel Agent", icon: Briefcase, desc: "Finds safety-certified lodgings and updates booking arrival check-ins.", tools: "Hotels MCP", speed: "250ms" },
                    { name: "Budget Agent", icon: DollarSign, desc: "Maintains budget ledgers and executes currency updates for expense metrics.", tools: "Budget Calculation", speed: "90ms" },
                    { name: "Currency Agent", icon: ArrowRightLeft, desc: "Evaluates daily exchange trends and flags lock-in money exchange signals.", tools: "Currency Service", speed: "110ms" },
                    { name: "Packing Agent", icon: CheckSquare, desc: "Compiles weather-appropriate packing recommendations automatically.", tools: "PackingList Skill", speed: "120ms" },
                    { name: "Safety Agent", icon: ShieldAlert, desc: "Vets advisory ratings, crime metrics, and generates emergency checklists.", tools: "Safety API", speed: "300ms" },
                    { name: "Language Agent", icon: BookOpen, desc: "Translates menu logs and updates regional basic communication guides.", tools: "Translation MCP", speed: "150ms" },
                    { name: "Local Guide Agent", icon: Compass, desc: "Curates dining selections, etiquette alerts, and hidden cultural guides.", tools: "LocalEtiquette Skill", speed: "170ms" },
                    { name: "Transportation Agent", icon: Activity, desc: "Optimizes airport transfers and aligns shuttle slots with flight delays.", tools: "LocalTransport Skill", speed: "220ms" },
                    { name: "Activity Planner", icon: Calendar, desc: "Compiles 5-day itineraries and shuffles time blocks dynamically.", tools: "Itinerary Engine", speed: "190ms" }
                  ].map((agent, idx) => {
                    const Icon = agent.icon;
                    return (
                      <div key={idx} className="glass rounded-2xl p-6 border-slate-800 flex flex-col justify-between min-h-[220px] hover:border-indigo-500/30 transition-all">
                        <div>
                          <div className="flex justify-between items-start">
                            <div className="p-2 bg-indigo-600/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                              <Icon className="h-5 w-5" />
                            </div>
                            <span className="text-3xs text-slate-500 font-mono">{agent.speed} latency</span>
                          </div>
                          
                          <h4 className="font-extrabold text-sm text-white mt-4">{agent.name}</h4>
                          <p className="text-slate-400 text-2xs mt-2 leading-relaxed">{agent.desc}</p>
                        </div>
                        
                        <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center text-3xs">
                          <span className="text-slate-500 uppercase tracking-widest font-mono">Tools: {agent.tools}</span>
                          <span className="text-emerald-400 flex items-center font-bold uppercase tracking-widest">
                            <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-400" />
                            Ready
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left: Upload card */}
                  <div className="glass rounded-2xl p-6 col-span-1 flex flex-col justify-between min-h-[300px]">
                    <div>
                      <h3 className="font-bold text-sm text-white mb-2">Upload Visa & Travel Documents</h3>
                      <p className="text-slate-400 text-xs">AI Visa Agent automatically extracts validity, passport numbers, and country checklists.</p>
                    </div>

                    <form onSubmit={handleFileUpload} className="space-y-4 mt-6">
                      <div className="border border-dashed border-slate-800 bg-slate-955/40 rounded-xl p-6 text-center hover:border-indigo-500/40 transition-all relative">
                        <input 
                          type="file" 
                          onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                        />
                        <Upload className="h-8 w-8 text-indigo-400 mx-auto mb-2 animate-bounce" />
                        <span className="text-2xs text-slate-400 block font-semibold">
                          {uploadFile ? uploadFile.name : "Click or drag files here (PDF, JPG, PNG)"}
                        </span>
                      </div>

                      <button 
                        type="submit" 
                        disabled={uploading || !uploadFile}
                        className="w-full h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold tracking-wider transition-all disabled:bg-slate-800 disabled:text-slate-500 cursor-pointer"
                      >
                        {uploading ? "Analyzing Document..." : "Upload & Parse"}
                      </button>
                    </form>
                  </div>

                  {/* Right: Parsed docs list */}
                  <div className="glass rounded-2xl p-6 col-span-1 lg:col-span-2 min-h-[300px] flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-white mb-4">Digitized Travel Vault</h3>
                      <div className="space-y-3">
                        {selectedTripDetails?.documents && selectedTripDetails.documents.length > 0 ? (
                          selectedTripDetails.documents.map((doc) => (
                            <div key={doc.id} className="p-4 rounded-xl border border-slate-800 bg-slate-955/40 flex justify-between items-center text-xs">
                              <div className="flex items-center space-x-3">
                                <FileText className="h-5 w-5 text-indigo-400" />
                                <div>
                                  <h4 className="font-bold text-white text-xs">{doc.file_name}</h4>
                                  <span className="text-3xs text-slate-500 font-mono">Uploaded {new Date(doc.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className={`px-2.5 py-0.5 rounded text-3xs font-bold uppercase tracking-wider ${
                                  doc.status === "Parsed" ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" : "bg-slate-800 text-slate-400"
                                }`}>
                                  {doc.status}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center p-8 text-slate-500 text-xs italic">No documents uploaded. Drag and drop passport or ticket copy above.</div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-2xs text-slate-400 flex items-center space-x-2 mt-4">
                      <Lock className="h-4 w-4 text-emerald-400" />
                      <span>Vault secured with local sandbox filesystem MCP constraints.</span>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* TAB: BUDGET LOG */}
            {activeTab === "budget" && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left: allocations chart */}
                  <div className="glass rounded-2xl p-6 col-span-1 lg:col-span-2 flex flex-col justify-between min-h-[380px]">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-sm text-white">Expense Allocation Ledger</h3>
                        <p className="text-slate-400 text-xs mt-0.5">Budget ledger compiled by Budget Agent.</p>
                      </div>
                      
                      {/* Currency Swap Toggle */}
                      <button 
                        onClick={() => setShowBudgetInHome(!showBudgetInHome)}
                        className="px-3.5 py-1.5 text-3xs font-extrabold bg-indigo-600/10 text-indigo-300 border border-indigo-500/20 rounded-xl hover:bg-indigo-600/20 transition-all min-h-[44px] cursor-pointer"
                      >
                        Toggle to {showBudgetInHome ? selectedTripDetails?.currency : selectedTripDetails?.home_currency}
                      </button>
                    </div>

                    <div className="h-[200px] w-full mt-4 flex items-center justify-center">
                      {selectedTripDetails?.budget_logs && selectedTripDetails.budget_logs.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={selectedTripDetails.budget_logs}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={4}
                              dataKey={showBudgetInHome ? "cost_home_currency" : "estimated_cost"}
                              nameKey="category"
                            >
                              {selectedTripDetails.budget_logs.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value, name) => [`${formatCurrency(Number(value), showBudgetInHome ? selectedTripDetails.home_currency || "USD" : selectedTripDetails.currency)}`, name]} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-slate-500 text-xs italic">No allocations mapped.</div>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-3xs text-slate-500 border-t border-slate-800/80 pt-4 mt-4">
                      <span>Interactive charts render real-time changes</span>
                      <span>Budget Health: 100% Optimized</span>
                    </div>
                  </div>

                  {/* Right: details details list */}
                  <div className="glass rounded-2xl p-6 col-span-1 min-h-[380px] overflow-y-auto no-scrollbar">
                    <h3 className="font-bold text-sm text-white mb-4">Breakdown & Auditing</h3>
                    
                    <div className="space-y-3.5">
                      {selectedTripDetails?.budget_logs.map((log, idx) => (
                        <div key={log.id} className="flex justify-between items-center border-b border-slate-900 pb-2.5 last:border-0 last:pb-0">
                          <div>
                            <span className="text-xs text-white font-semibold flex items-center">
                              <span className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                              {log.category}
                            </span>
                            <span className="text-3xs text-slate-500 block mt-0.5">{log.notes || "Approved allocation"}</span>
                          </div>
                          <span className="text-xs text-white font-mono font-semibold">
                            {formatCurrency(showBudgetInHome ? (log.cost_home_currency || log.estimated_cost) : log.estimated_cost, showBudgetInHome ? selectedTripDetails.home_currency || "USD" : selectedTripDetails.currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* TAB: CURRENCY INTEL */}
            {activeTab === "currency" && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left: Trend Graph */}
                  <div className="glass rounded-2xl p-6 col-span-1 lg:col-span-2 h-[420px] flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-white mb-1">Exchange Rate Trend Tracker</h3>
                      <p className="text-slate-400 text-xs">Fluctuation metrics for {selectedTripDetails?.currency} relative to {selectedTripDetails?.home_currency}</p>
                    </div>
                    
                    <div className="h-[250px] w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={currencyRates?.trends?.weekly_trend || mockWeeklyTrend}>
                          <defs>
                            <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="day" stroke="#475569" fontSize={9} tickLine={false} />
                          <YAxis stroke="#475569" fontSize={9} domain={['auto', 'auto']} tickLine={false} />
                          <Tooltip formatter={(value) => [`${value}`, 'Exchange Rate']} contentStyle={{ backgroundColor: "#0b0f19", borderColor: "#1e293b", borderRadius: "12px", fontSize: "11px" }} />
                          <Area type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRate)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="text-3xs text-slate-500 flex justify-between border-t border-slate-800/80 pt-4 mt-2">
                      <span>Timestamp: {currencyRates?.last_updated || "Live"}</span>
                      <span>Trend Confidence: High</span>
                    </div>
                  </div>

                  {/* Right: Premium Currency Converter Widget */}
                  <div className="glass rounded-2xl p-6 col-span-1 h-[420px] flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-white mb-4">Currency Exchange Intelligence</h3>
                      
                      <div className="space-y-4">
                        {/* FROM Currency Selector */}
                        <div className="relative">
                          <label className="text-3xs text-slate-500 uppercase tracking-widest font-bold block mb-1">Convert From</label>
                          <button 
                            type="button"
                            onClick={() => setShowFromList(!showFromList)}
                            className="w-full bg-slate-955 border border-slate-900 text-xs px-4 py-3 rounded-xl focus:outline-none text-white text-left flex justify-between items-center min-h-[44px] cursor-pointer"
                          >
                            <span>{convertFrom}</span>
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          </button>
                          
                          <AnimatePresence>
                            {showFromList && (
                              <motion.div 
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="absolute left-0 w-full mt-2 bg-[#0b0f19] border border-slate-800 rounded-xl max-h-[140px] overflow-y-auto z-30 shadow-2xl no-scrollbar"
                              >
                                {["USD", "EUR", "JPY", "INR", "GBP", "AUD"].map((cur, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      setConvertFrom(cur);
                                      setShowFromList(false);
                                    }}
                                    className="w-full text-left px-4 py-3 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white min-h-[44px] cursor-pointer"
                                  >
                                    {cur}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* TO Currency Selector */}
                        <div className="relative">
                          <label className="text-3xs text-slate-500 uppercase tracking-widest font-bold block mb-1">Convert To</label>
                          <button 
                            type="button"
                            onClick={() => setShowToList(!showToList)}
                            className="w-full bg-slate-955 border border-slate-900 text-xs px-4 py-3 rounded-xl focus:outline-none text-white text-left flex justify-between items-center min-h-[44px] cursor-pointer"
                          >
                            <span>{convertTo}</span>
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          </button>

                          <AnimatePresence>
                            {showToList && (
                              <motion.div 
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="absolute left-0 w-full mt-2 bg-[#0b0f19] border border-slate-800 rounded-xl max-h-[140px] overflow-y-auto z-30 shadow-2xl no-scrollbar"
                              >
                                {["USD", "EUR", "JPY", "INR", "GBP", "AUD"].map((cur, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      setConvertTo(cur);
                                      setShowToList(false);
                                    }}
                                    className="w-full text-left px-4 py-3 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white min-h-[44px] cursor-pointer"
                                  >
                                    {cur}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Amount */}
                        <div>
                          <label className="text-3xs text-slate-500 uppercase tracking-widest font-bold block mb-1">Exchange Amount</label>
                          <input 
                            type="number" 
                            value={convertAmount}
                            onChange={(e) => setConvertAmount(Number(e.target.value))}
                            className="w-full bg-slate-955 border border-slate-900 text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 text-white min-h-[44px]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Result */}
                    <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-300 text-center mt-6">
                      <span className="text-3xs uppercase tracking-widest font-bold block text-slate-500 mb-1">Calculated Conversion</span>
                      <h4 className="text-lg font-black font-mono">
                        {convertAmount.toLocaleString()} {convertFrom} = {roundConversion(convertAmount, convertFrom, convertTo)} {convertTo}
                      </h4>
                    </div>
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
                    <select className="w-full bg-slate-955 border border-slate-900 text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 text-white min-h-[44px] cursor-pointer">
                      <option>gemini-flash-latest (Vertex AI)</option>
                      <option>gemini-2.5-flash (Vertex AI API)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase block mb-1.5">Google Cloud Project ID</label>
                    <input type="text" value="travel-mission-capstone" readOnly className="w-full bg-slate-955 border border-slate-900 text-xs px-4 py-3 rounded-xl text-slate-500 focus:outline-none cursor-not-allowed min-h-[44px]" />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase block mb-1.5">GCP Regional Host</label>
                    <input type="text" value="global (Vertex AI Endpoint)" readOnly className="w-full bg-slate-955 border border-slate-900 text-xs px-4 py-3 rounded-xl text-slate-500 focus:outline-none cursor-not-allowed min-h-[44px]" />
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

  // Fake conversion factor helper for standalone converter
  function roundConversion(amount: number, from: string, to: string) {
    if (from === to) return amount.toFixed(2);
    
    const rates: any = {
      USD: { EUR: 0.92, JPY: 155.4, INR: 83.5, GBP: 0.79, AUD: 1.51 },
      EUR: { USD: 1.09, JPY: 168.9, INR: 90.7, GBP: 0.86, AUD: 1.64 },
      JPY: { USD: 0.0064, EUR: 0.0059, INR: 0.54, GBP: 0.0051, AUD: 0.0097 },
      INR: { USD: 0.012, EUR: 0.011, JPY: 1.86, GBP: 0.0095, AUD: 0.018 },
      GBP: { USD: 1.27, EUR: 1.16, JPY: 196.7, INR: 105.3, AUD: 1.91 },
      AUD: { USD: 0.66, EUR: 0.61, JPY: 102.9, INR: 55.2, GBP: 0.52 }
    };
    
    const factor = rates[from]?.[to] || 1.0;
    return (amount * factor).toFixed(2);
  }
}
