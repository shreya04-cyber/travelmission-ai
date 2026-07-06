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
  currencyName: string;
  symbol: string;
}

const COUNTRIES: Country[] = [
  { name: "India", code: "IN", flag: "🇮🇳", currency: "INR", currencyName: "Indian Rupee", symbol: "₹" },
  { name: "United States", code: "US", flag: "🇺🇸", currency: "USD", currencyName: "United States Dollar", symbol: "$" },
  { name: "United Kingdom", code: "GB", flag: "🇬🇧", currency: "GBP", currencyName: "British Pound", symbol: "£" },
  { name: "Eurozone", code: "EU", flag: "🇪🇺", currency: "EUR", currencyName: "Euro", symbol: "€" },
  { name: "Japan", code: "JP", flag: "🇯🇵", currency: "JPY", currencyName: "Japanese Yen", symbol: "¥" },
  { name: "Canada", code: "CA", flag: "🇨🇦", currency: "CAD", currencyName: "Canadian Dollar", symbol: "C$" },
  { name: "Australia", code: "AU", flag: "🇦🇺", currency: "AUD", currencyName: "Australian Dollar", symbol: "A$" },
  { name: "Switzerland", code: "CH", flag: "🇨🇭", currency: "CHF", currencyName: "Swiss Franc", symbol: "Fr" },
  { name: "China", code: "CN", flag: "🇨🇳", currency: "CNY", currencyName: "Chinese Yuan", symbol: "¥" },
  { name: "South Korea", code: "KR", flag: "🇰🇷", currency: "KRW", currencyName: "South Korean Won", symbol: "₩" },
  { name: "Singapore", code: "SG", flag: "🇸🇬", currency: "SGD", currencyName: "Singapore Dollar", symbol: "S$" },
  { name: "United Arab Emirates", code: "AE", flag: "🇦🇪", currency: "AED", currencyName: "UAE Dirham", symbol: "د.إ" },
  { name: "Qatar", code: "QA", flag: "🇶🇦", currency: "QAR", currencyName: "Qatari Riyal", symbol: "ر.ق" },
  { name: "Saudi Arabia", code: "SA", flag: "🇸🇦", currency: "SAR", currencyName: "Saudi Riyal", symbol: "SR" },
  { name: "Thailand", code: "TH", flag: "🇹🇭", currency: "THB", currencyName: "Thai Baht", symbol: "฿" },
  { name: "Malaysia", code: "MY", flag: "🇲🇾", currency: "MYR", currencyName: "Malaysian Ringgit", symbol: "RM" },
  { name: "New Zealand", code: "NZ", flag: "🇳🇿", currency: "NZD", currencyName: "New Zealand Dollar", symbol: "NZ$" },
  { name: "Afghanistan", code: "AF", flag: "🇦🇫", currency: "AFN", currencyName: "Afghan Afghani", symbol: "؋" },
  { name: "Albania", code: "AL", flag: "🇦🇱", currency: "ALL", currencyName: "Albanian Lek", symbol: "L" },
  { name: "Algeria", code: "DZ", flag: "🇩🇿", currency: "DZD", currencyName: "Algerian Dinar", symbol: "د.ج" },
  { name: "Angola", code: "AO", flag: "🇦🇴", currency: "AOA", currencyName: "Angolan Kwanza", symbol: "Kz" },
  { name: "Argentina", code: "AR", flag: "🇦🇷", currency: "ARS", currencyName: "Argentine Peso", symbol: "$" },
  { name: "Armenia", code: "AM", flag: "🇦🇲", currency: "AMD", currencyName: "Armenian Dram", symbol: "֏" },
  { name: "Azerbaijan", code: "AZ", flag: "🇦🇿", currency: "AZN", currencyName: "Azerbaijani Manat", symbol: "₼" },
  { name: "Bahamas", code: "BS", flag: "🇧🇸", currency: "BSD", currencyName: "Bahamian Dollar", symbol: "$" },
  { name: "Bahrain", code: "BH", flag: "🇧🇭", currency: "BHD", currencyName: "Bahraini Dinar", symbol: ".د.ب" },
  { name: "Bangladesh", code: "BD", flag: "🇧🇩", currency: "BDT", currencyName: "Bangladeshi Taka", symbol: "৳" },
  { name: "Barbados", code: "BB", flag: "🇧🇧", currency: "BBD", currencyName: "Barbadian Dollar", symbol: "$" },
  { name: "Belarus", code: "BY", flag: "🇧🇾", currency: "BYN", currencyName: "Belarusian Ruble", symbol: "Br" },
  { name: "Belize", code: "BZ", flag: "🇧🇿", currency: "BZD", currencyName: "Belize Dollar", symbol: "$" },
  { name: "Benin", code: "BJ", flag: "🇧🇯", currency: "XOF", currencyName: "West African CFA Franc", symbol: "Fr" },
  { name: "Bermuda", code: "BM", flag: "🇧🇲", currency: "BMD", currencyName: "Bermudian Dollar", symbol: "$" },
  { name: "Bhutan", code: "BT", flag: "🇧🇹", currency: "BTN", currencyName: "Bhutanese Ngultrum", symbol: "Nu." },
  { name: "Bolivia", code: "BO", flag: "🇧🇴", currency: "BOB", currencyName: "Bolivian Boliviano", symbol: "Bs." },
  { name: "Bosnia and Herzegovina", code: "BA", flag: "🇧🇦", currency: "BAM", currencyName: "Convertible Mark", symbol: "KM" },
  { name: "Botswana", code: "BW", flag: "🇧🇼", currency: "BWP", currencyName: "Botswana Pula", symbol: "P" },
  { name: "Brazil", code: "BR", flag: "🇧🇷", currency: "BRL", currencyName: "Brazilian Real", symbol: "R$" },
  { name: "Brunei", code: "BN", flag: "🇧🇳", currency: "BND", currencyName: "Brunei Dollar", symbol: "$" },
  { name: "Bulgaria", code: "BG", flag: "🇧🇬", currency: "BGN", currencyName: "Bulgarian Lev", symbol: "лв" },
  { name: "Burkina Faso", code: "BF", flag: "🇧🇫", currency: "XOF", currencyName: "West African CFA Franc", symbol: "Fr" },
  { name: "Burundi", code: "BI", flag: "🇧🇮", currency: "BIF", currencyName: "Burundian Franc", symbol: "Fr" },
  { name: "Cambodia", code: "KH", flag: "🇰🇭", currency: "KHR", currencyName: "Cambodian Riel", symbol: "៛" },
  { name: "Cameroon", code: "CM", flag: "🇨🇲", currency: "XAF", currencyName: "Central African CFA Franc", symbol: "Fr" },
  { name: "Cape Verde", code: "CV", flag: "🇨🇻", currency: "CVE", currencyName: "Cape Verdean Escudo", symbol: "Esc" },
  { name: "Central African Republic", code: "CF", flag: "🇨🇫", currency: "XAF", currencyName: "Central African CFA Franc", symbol: "Fr" },
  { name: "Chad", code: "TD", flag: "🇹🇩", currency: "XAF", currencyName: "Central African CFA Franc", symbol: "Fr" },
  { name: "Chile", code: "CL", flag: "🇨🇱", currency: "CLP", currencyName: "Chilean Peso", symbol: "$" },
  { name: "Colombia", code: "CO", flag: "🇨🇴", currency: "COP", currencyName: "Colombian Peso", symbol: "$" },
  { name: "Comoros", code: "KM", flag: "🇰🇲", currency: "KMF", currencyName: "Comorian Franc", symbol: "Fr" },
  { name: "Congo", code: "CD", flag: "🇨🇬", currency: "CDF", currencyName: "Congolese Franc", symbol: "Fr" },
  { name: "Costa Rica", code: "CR", flag: "🇨🇷", currency: "CRC", currencyName: "Costa Rican Colón", symbol: "₡" },
  { name: "Cuba", code: "CU", flag: "🇨🇺", currency: "CUP", currencyName: "Cuban Peso", symbol: "$" },
  { name: "Czech Republic", code: "CZ", flag: "🇨🇿", currency: "CZK", currencyName: "Czech Koruna", symbol: "Kč" },
  { name: "Denmark", code: "DK", flag: "🇩🇰", currency: "DKK", currencyName: "Danish Krone", symbol: "kr" },
  { name: "Djibouti", code: "DJ", flag: "🇩🇯", currency: "DJF", currencyName: "Djiboutian Franc", symbol: "Fr" },
  { name: "Dominican Republic", code: "DO", flag: "🇩🇴", currency: "DOP", currencyName: "Dominican Peso", symbol: "$" },
  { name: "Ecuador", code: "EC", flag: "🇪🇨", currency: "USD", currencyName: "United States Dollar", symbol: "$" },
  { name: "Egypt", code: "EG", flag: "🇪🇬", currency: "EGP", currencyName: "Egyptian Pound", symbol: "E£" },
  { name: "El Salvador", code: "SV", flag: "🇸🇻", currency: "USD", currencyName: "United States Dollar", symbol: "$" },
  { name: "Equatorial Guinea", code: "GQ", flag: "🇬🇶", currency: "XAF", currencyName: "Central African CFA Franc", symbol: "Fr" },
  { name: "Eritrea", code: "ER", flag: "🇪🇷", currency: "ERN", currencyName: "Eritrean Nakfa", symbol: "Nfk" },
  { name: "Estonia", code: "EE", flag: "🇪🇪", currency: "EUR", currencyName: "Euro", symbol: "€" },
  { name: "Eswatini", code: "SZ", flag: "🇸🇿", currency: "SZL", currencyName: "Swazi Lilangeni", symbol: "L" },
  { name: "Ethiopia", code: "ET", flag: "🇪🇹", currency: "ETB", currencyName: "Ethiopian Birr", symbol: "Br" },
  { name: "Fiji", code: "FJ", flag: "🇫🇯", currency: "FJD", currencyName: "Fijian Dollar", symbol: "$" },
  { name: "Finland", code: "FI", flag: "🇫🇮", currency: "EUR", currencyName: "Euro", symbol: "€" },
  { name: "France", code: "FR", flag: "🇫🇷", currency: "EUR", currencyName: "Euro", symbol: "€" },
  { name: "Gabon", code: "GA", flag: "🇬🇦", currency: "XAF", currencyName: "Central African CFA Franc", symbol: "Fr" },
  { name: "Gambia", code: "GM", flag: "🇬🇲", currency: "GMD", currencyName: "Gambian Dalasi", symbol: "D" },
  { name: "Georgia", code: "GE", flag: "🇬🇪", currency: "GEL", currencyName: "Georgian Lari", symbol: "₾" },
  { name: "Germany", code: "DE", flag: "🇩🇪", currency: "EUR", currencyName: "Euro", symbol: "€" },
  { name: "Ghana", code: "GH", flag: "🇬🇭", currency: "GHS", currencyName: "Ghanaian Cedi", symbol: "₵" },
  { name: "Greece", code: "GR", flag: "🇬🇷", currency: "EUR", currencyName: "Euro", symbol: "€" },
  { name: "Guatemala", code: "GT", flag: "🇬🇹", currency: "GTQ", currencyName: "Guatemalan Quetzal", symbol: "Q" },
  { name: "Guinea", code: "GN", flag: "🇬🇳", currency: "GNF", currencyName: "Guinean Franc", symbol: "Fr" },
  { name: "Guinea-Bissau", code: "GW", flag: "🇬🇼", currency: "XOF", currencyName: "West African CFA Franc", symbol: "Fr" },
  { name: "Guyana", code: "GY", flag: "🇬🇾", currency: "GYD", currencyName: "Guyanese Dollar", symbol: "$" },
  { name: "Haiti", code: "HT", flag: "🇭🇹", currency: "HTG", currencyName: "Haitian Gourde", symbol: "G" },
  { name: "Honduras", code: "HN", flag: "🇭🇳", currency: "HNL", currencyName: "Honduran Lempira", symbol: "L" },
  { name: "Hong Kong", code: "HK", flag: "🇭🇰", currency: "HKD", currencyName: "Hong Kong Dollar", symbol: "HK$" },
  { name: "Hungary", code: "HU", flag: "🇭🇺", currency: "HUF", currencyName: "Hungarian Forint", symbol: "Ft" },
  { name: "Iceland", code: "IS", flag: "🇮🇸", currency: "ISK", currencyName: "Icelandic Króna", symbol: "kr" },
  { name: "Indonesia", code: "ID", flag: "🇮🇩", currency: "IDR", currencyName: "Indonesian Rupiah", symbol: "Rp" },
  { name: "Iran", code: "IR", flag: "🇮🇷", currency: "IRR", currencyName: "Iranian Rial", symbol: "﷼" },
  { name: "Iraq", code: "IQ", flag: "🇮🇶", currency: "IQD", currencyName: "Iraqi Dinar", symbol: "ع.د" },
  { name: "Ireland", code: "IE", flag: "🇮🇪", currency: "EUR", currencyName: "Euro", symbol: "€" },
  { name: "Israel", code: "IL", flag: "🇮🇱", currency: "ILS", currencyName: "Israeli New Shekel", symbol: "₪" },
  { name: "Italy", code: "IT", flag: "🇮🇹", currency: "EUR", currencyName: "Euro", symbol: "€" },
  { name: "Jamaica", code: "JM", flag: "🇯🇲", currency: "JMD", currencyName: "Jamaican Dollar", symbol: "$" },
  { name: "Jordan", code: "JO", flag: "🇯🇴", currency: "JOD", currencyName: "Jordanian Dinar", symbol: "د.ا" },
  { name: "Kazakhstan", code: "KZ", flag: "🇰🇿", currency: "KZT", currencyName: "Kazakhstani Tenge", symbol: "₸" },
  { name: "Kenya", code: "KE", flag: "🇰🇪", currency: "KES", currencyName: "Kenyan Shilling", symbol: "Sh" },
  { name: "Kuwait", code: "KW", flag: "🇰🇼", currency: "KWD", currencyName: "Kuwaiti Dinar", symbol: "د.ك" },
  { name: "Kyrgyzstan", code: "KG", flag: "🇰🇬", currency: "KGS", currencyName: "Kyrgyzstani Som", symbol: "с" },
  { name: "Laos", code: "LA", flag: "🇱🇦", currency: "LAK", currencyName: "Lao Kip", symbol: "₭" },
  { name: "Latvia", code: "LV", flag: "🇱🇻", currency: "EUR", currencyName: "Euro", symbol: "€" },
  { name: "Lebanon", code: "LB", flag: "🇱🇧", currency: "LBP", currencyName: "Lebanese Pound", symbol: "ل.ل" },
  { name: "Lesotho", code: "LS", flag: "🇱🇸", currency: "LSL", currencyName: "Lesotho Loti", symbol: "L" },
  { name: "Liberia", code: "LR", flag: "🇱🇷", currency: "LRD", currencyName: "Liberian Dollar", symbol: "$" },
  { name: "Libya", code: "LY", flag: "🇱🇾", currency: "LYD", currencyName: "Libyan Dinar", symbol: "د.ل" },
  { name: "Liechtenstein", code: "LI", flag: "🇱🇮", currency: "CHF", currencyName: "Swiss Franc", symbol: "Fr" },
  { name: "Lithuania", code: "LT", flag: "🇱🇹", currency: "EUR", currencyName: "Euro", symbol: "€" },
  { name: "Luxembourg", code: "LU", flag: "🇱🇺", currency: "EUR", currencyName: "Euro", symbol: "€" },
  { name: "Macao", code: "MO", flag: "🇲🇴", currency: "MOP", currencyName: "Macanese Pataca", symbol: "P" },
  { name: "Madagascar", code: "MG", flag: "🇲🇬", currency: "MGA", currencyName: "Malagasy Ariary", symbol: "Ar" },
  { name: "Malawi", code: "MW", flag: "🇲🇼", currency: "MWK", currencyName: "Malawian Kwacha", symbol: "MK" },
  { name: "Maldives", code: "MV", flag: "🇲🇻", currency: "MVR", currencyName: "Maldivian Rufiyaa", symbol: "Rf" },
  { name: "Mali", code: "ML", flag: "🇲🇱", currency: "XOF", currencyName: "West African CFA Franc", symbol: "Fr" },
  { name: "Malta", code: "MT", flag: "🇲🇹", currency: "EUR", currencyName: "Euro", symbol: "€" },
  { name: "Marshall Islands", code: "MH", flag: "🇲🇭", currency: "USD", currencyName: "United States Dollar", symbol: "$" },
  { name: "Mauritania", code: "MR", flag: "🇲🇷", currency: "MRU", currencyName: "Mauritanian Ouguiya", symbol: "UM" },
  { name: "Mauritius", code: "MU", flag: "🇲🇺", currency: "MUR", currencyName: "Mauritian Rupee", symbol: "₨" },
  { name: "Mexico", code: "MX", flag: "🇲🇽", currency: "MXN", currencyName: "Mexican Peso", symbol: "$" },
  { name: "Micronesia", code: "FM", flag: "🇫🇲", currency: "USD", currencyName: "United States Dollar", symbol: "$" },
  { name: "Moldova", code: "MD", flag: "🇲🇩", currency: "MDL", currencyName: "Moldovan Leu", symbol: "L" },
  { name: "Monaco", code: "MC", flag: "🇲🇨", currency: "EUR", currencyName: "Euro", symbol: "€" },
  { name: "Mongolia", code: "MN", flag: "🇲🇳", currency: "MNT", currencyName: "Mongolian Tögrög", symbol: "₮" },
  { name: "Montenegro", code: "ME", flag: "🇲🇪", currency: "EUR", currencyName: "Euro", symbol: "€" },
  { name: "Morocco", code: "MA", flag: "🇲🇦", currency: "MAD", currencyName: "Moroccan Dirham", symbol: "د.م." },
  { name: "Mozambique", code: "MZ", flag: "🇲🇿", currency: "MZN", currencyName: "Mozambican Metical", symbol: "MT" },
  { name: "Myanmar", code: "MM", flag: "🇲🇲", currency: "MMK", currencyName: "Myanmar Kyat", symbol: "K" },
  { name: "Namibia", code: "NA", flag: "🇳🇦", currency: "NAD", currencyName: "Namibian Dollar", symbol: "$" },
  { name: "Nauru", code: "NR", flag: "🇳🇷", currency: "AUD", currencyName: "Australian Dollar", symbol: "$" },
  { name: "Nepal", code: "NP", flag: "🇳🇵", currency: "NPR", currencyName: "Nepalese Rupee", symbol: "₨" },
  { name: "Netherlands", code: "NL", flag: "🇳🇱", currency: "EUR", currencyName: "Euro", symbol: "€" },
  { name: "Nicaragua", code: "NI", flag: "🇳🇮", currency: "NIO", currencyName: "Nicaraguan Córdoba", symbol: "C$" },
  { name: "Niger", code: "NE", flag: "🇳🇪", currency: "XOF", currencyName: "West African CFA Franc", symbol: "Fr" },
  { name: "Nigeria", code: "NG", flag: "🇳🇬", currency: "NGN", currencyName: "Nigerian Naira", symbol: "₦" },
  { name: "North Korea", code: "KP", flag: "🇰🇵", currency: "KPW", currencyName: "North Korean Won", symbol: "₩" },
  { name: "North Macedonia", code: "MK", flag: "🇲🇰", currency: "MKD", currencyName: "Macedonian Denar", symbol: "ден" },
  { name: "Norway", code: "NO", flag: "🇳🇴", currency: "NOK", currencyName: "Norwegian Krone", symbol: "kr" },
  { name: "Oman", code: "OM", flag: "🇴🇲", currency: "OMR", currencyName: "Omani Rial", symbol: "ر.ع." },
  { name: "Pakistan", code: "PK", flag: "🇵🇰", currency: "PKR", currencyName: "Pakistani Rupee", symbol: "₨" },
  { name: "Palau", code: "PW", flag: "🇵🇼", currency: "USD", currencyName: "United States Dollar", symbol: "$" },
  { name: "Palestine", code: "PS", flag: "🇵🇸", currency: "ILS", currencyName: "Israeli New Shekel", symbol: "₪" },
  { name: "Panama", code: "PA", flag: "🇵🇦", currency: "PAB", currencyName: "Panamanian Balboa", symbol: "B/." },
  { name: "Papua New Guinea", code: "PG", flag: "🇵🇬", currency: "PGK", currencyName: "Papua New Guinean Kina", symbol: "K" },
  { name: "Paraguay", code: "PY", flag: "🇵🇾", currency: "PYG", currencyName: "Paraguayan Guaraní", symbol: "₲" },
  { name: "Peru", code: "PE", flag: "🇵🇪", currency: "PEN", currencyName: "Peruvian Sol", symbol: "S/." },
  { name: "Philippines", code: "PH", flag: "🇵🇭", currency: "PHP", currencyName: "Philippine Peso", symbol: "₱" },
  { name: "Poland", code: "PL", flag: "🇵🇱", currency: "PLN", currencyName: "Polish Złoty", symbol: "zł" },
  { name: "Portugal", code: "PT", flag: "🇵🇹", currency: "EUR", currencyName: "Euro", symbol: "€" },
  { name: "Romania", code: "RO", flag: "🇷🇴", currency: "RON", currencyName: "Romanian Leu", symbol: "lei" },
  { name: "Russia", code: "RU", flag: "🇷🇺", currency: "RUB", currencyName: "Russian Ruble", symbol: "₽" },
  { name: "Rwanda", code: "RW", flag: "🇷🇼", currency: "RWF", currencyName: "Rwandan Franc", symbol: "Fr" },
  { name: "Saint Kitts and Nevis", code: "KN", flag: "🇰🇳", currency: "XCD", currencyName: "East Caribbean Dollar", symbol: "$" },
  { name: "Saint Lucia", code: "LC", flag: "🇱🇨", currency: "XCD", currencyName: "East Caribbean Dollar", symbol: "$" },
  { name: "Saint Vincent and the Grenadines", code: "VC", flag: "🇻🇨", currency: "XCD", currencyName: "East Caribbean Dollar", symbol: "$" },
  { name: "Samoa", code: "WS", flag: "🇼🇸", currency: "WST", currencyName: "Samoan Tālā", symbol: "T" },
  { name: "San Marino", code: "SM", flag: "🇸🇲", currency: "EUR", currencyName: "Euro", symbol: "€" },
  { name: "Sao Tome and Principe", code: "ST", flag: "🇸🇹", currency: "STN", currencyName: "São Tomé and Príncipe Dobra", symbol: "Db" },
  { name: "Senegal", code: "SN", flag: "🇸🇳", currency: "XOF", currencyName: "West African CFA Franc", symbol: "Fr" },
  { name: "Serbia", code: "RS", flag: "🇷🇸", currency: "RSD", currencyName: "Serbian Dinar", symbol: "د.ب." },
  { name: "Seychelles", code: "SC", flag: "🇸🇨", currency: "SCR", currencyName: "Seychellois Rupee", symbol: "₨" },
  { name: "Sierra Leone", code: "SL", flag: "🇸🇱", currency: "SLE", currencyName: "Sierra Leonean Leone", symbol: "Le" },
  { name: "Slovakia", code: "SK", flag: "🇸🇰", currency: "EUR", currencyName: "Euro", symbol: "€" },
  { name: "Slovenia", code: "SI", flag: "🇸🇮", currency: "EUR", currencyName: "Euro", symbol: "€" },
  { name: "Solomon Islands", code: "SB", flag: "🇸🇧", currency: "SBD", currencyName: "Solomon Islands Dollar", symbol: "$" },
  { name: "Somalia", code: "SO", flag: "🇸🇴", currency: "SOS", currencyName: "Somali Shilling", symbol: "Sh" },
  { name: "South Africa", code: "ZA", flag: "🇿🇦", currency: "ZAR", currencyName: "South African Rand", symbol: "R" },
  { name: "South Sudan", code: "SS", flag: "🇸🇸", currency: "SSP", currencyName: "South Sudanese Pound", symbol: "£" },
  { name: "Spain", code: "ES", flag: "🇪🇸", currency: "EUR", currencyName: "Euro", symbol: "€" },
  { name: "Sri Lanka", code: "LK", flag: "🇱🇰", currency: "LKR", currencyName: "Sri Lankan Rupee", symbol: "₨" },
  { name: "Sudan", code: "SD", flag: "🇸🇩", currency: "SDG", currencyName: "Sudanese Pound", symbol: "ج.س." },
  { name: "Suriname", code: "SR", flag: "🇸🇷", currency: "SRD", currencyName: "Surinamese Dollar", symbol: "$" },
  { name: "Sweden", code: "SE", flag: "🇸🇪", currency: "SEK", currencyName: "Swedish Krona", symbol: "kr" },
  { name: "Syria", code: "SY", flag: "🇸🇾", currency: "SYP", currencyName: "Syrian Pound", symbol: "£" },
  { name: "Taiwan", code: "TW", flag: "🇹🇼", currency: "TWD", currencyName: "New Taiwan Dollar", symbol: "NT$" },
  { name: "Tajikistan", code: "TJ", flag: "🇹🇯", currency: "TJS", currencyName: "Tajikistani Somoni", symbol: "ЅМ" },
  { name: "Tanzania", code: "TZ", flag: "🇹🇿", currency: "TZS", currencyName: "Tanzanian Shilling", symbol: "Sh" },
  { name: "Timor-Leste", code: "TL", flag: "🇹🇱", currency: "USD", currencyName: "United States Dollar", symbol: "$" },
  { name: "Togo", code: "TG", flag: "🇹🇬", currency: "XOF", currencyName: "West African CFA Franc", symbol: "Fr" },
  { name: "Tonga", code: "TO", flag: "🇹🇴", currency: "TOP", currencyName: "Tongan Paʻanga", symbol: "T$" },
  { name: "Trinidad and Tobago", code: "TT", flag: "🇹🇹", currency: "TTD", currencyName: "Trinidad and Tobago Dollar", symbol: "$" },
  { name: "Tunisia", code: "TN", flag: "🇹🇳", currency: "TND", currencyName: "Tunisian Dinar", symbol: "د.ت" },
  { name: "Turkey", code: "TR", flag: "🇹🇷", currency: "TRY", currencyName: "Turkish Lira", symbol: "₺" },
  { name: "Turkmenistan", code: "TM", flag: "🇹🇲", currency: "TMT", currencyName: "Turkmenistan Manat", symbol: "m" },
  { name: "Tuvalu", code: "TV", flag: "🇹🇻", currency: "AUD", currencyName: "Tuvaluan Dollar", symbol: "$" },
  { name: "Uganda", code: "UG", flag: "🇺🇬", currency: "UGX", currencyName: "Ugandan Shilling", symbol: "Sh" },
  { name: "Ukraine", code: "UA", flag: "🇺🇦", currency: "UAH", currencyName: "Ukrainian Hryvnia", symbol: "₴" },
  { name: "Uruguay", code: "UY", flag: "🇺🇾", currency: "UYU", currencyName: "Uruguayan Peso", symbol: "$U" },
  { name: "Uzbekistan", code: "UZ", flag: "🇺🇿", currency: "UZS", currencyName: "Uzbekistani So'm", symbol: "сўм" },
  { name: "Vanuatu", code: "VU", flag: "🇻🇺", currency: "VUV", currencyName: "Vanuatu Vatu", symbol: "Vt" },
  { name: "Vatican City", code: "VA", flag: "🇻🇦", currency: "EUR", currencyName: "Euro", symbol: "€" },
  { name: "Venezuela", code: "VE", flag: "🇻🇪", currency: "VES", currencyName: "Venezuelan Bolívar Soberano", symbol: "Bs.S" },
  { name: "Vietnam", code: "VN", flag: "🇻🇳", currency: "VND", currencyName: "Vietnamese Đồng", symbol: "₫" },
  { name: "Yemen", code: "YE", flag: "🇾🇪", currency: "YER", currencyName: "Yemeni Rial", symbol: "﷼" },
  { name: "Zambia", code: "ZM", flag: "🇿🇲", currency: "ZMW", currencyName: "Zambian Kwacha", symbol: "ZK" },
  { name: "Zimbabwe", code: "ZW", flag: "🇿🇼", currency: "ZWL", currencyName: "Zimbabwean Dollar", symbol: "$" }
];

const COLORS = ["#6366f1", "#10b981", "#f43f5e", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899"];

export default function MissionControlDashboard() {
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  
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
  
  const [homeCountrySearch, setHomeCountrySearch] = useState<string>("");
  const [showHomeCountryDropdown, setShowHomeCountryDropdown] = useState<boolean>(false);
  
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
  const [convertAmountFrom, setConvertAmountFrom] = useState<number>(100);
  const [convertAmountTo, setConvertAmountTo] = useState<number>(92);
  const [convertFrom, setConvertFrom] = useState<string>("USD");
  const [convertTo, setConvertTo] = useState<string>("EUR");
  const [searchFrom, setSearchFrom] = useState<string>("");
  const [searchTo, setSearchTo] = useState<string>("");
  const [showFromList, setShowFromList] = useState<boolean>(false);
  const [showToList, setShowToList] = useState<boolean>(false);

  // Global Currency Converter Additional States
  const [recentlyUsed, setRecentlyUsed] = useState<Array<{from: string, to: string}>>([]);
  const [liveRatesMap, setLiveRatesMap] = useState<Record<string, number>>({});
  const [ratesLastUpdated, setRatesLastUpdated] = useState<string>("");

  // File upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  
  // Chat state
  const [chatMessage, setChatMessage] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<{sender: string, text: string}[]>([
    { sender: "Lead Planner", text: "Welcome to TravelMission AI. Select a trip or create a new travel mission to begin." }
  ]);

  // Refs
  const activityEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);

  // Avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    fetchTrips();
  }, []);

  // Load recently used on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("recently_used_currencies");
      if (stored) {
        setRecentlyUsed(JSON.parse(stored));
      } else {
        const defaults = [
          { from: "USD", to: "INR" },
          { from: "EUR", to: "JPY" },
          { from: "GBP", to: "AED" }
        ];
        setRecentlyUsed(defaults);
        localStorage.setItem("recently_used_currencies", JSON.stringify(defaults));
      }
    }
  }, []);

  const addToRecentlyUsed = (from: string, to: string) => {
    if (typeof window !== "undefined") {
      const newPair = { from, to };
      const filtered = recentlyUsed.filter(p => !(p.from === from && p.to === to));
      const updated = [newPair, ...filtered].slice(0, 5);
      setRecentlyUsed(updated);
      localStorage.setItem("recently_used_currencies", JSON.stringify(updated));
    }
  };

  const fetchLiveRates = async (base: string) => {
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.rates) {
          setLiveRatesMap(data.rates);
          if (data.time_last_update_unix) {
            const date = new Date(data.time_last_update_unix * 1000);
            setRatesLastUpdated(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          } else {
            setRatesLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }
          return;
        }
      }
    } catch (err) {
      console.error("Live rates fetch error, using fallback: ", err);
    }
    
    // Fallback if API fails
    const fallbackMap: Record<string, number> = {};
    COUNTRIES.forEach(c => {
      fallbackMap[c.currency] = getStaticRate(base, c.currency);
    });
    setLiveRatesMap(fallbackMap);
    setRatesLastUpdated("Fallback Live");
  };

  // Re-fetch whenever convertFrom changes
  useEffect(() => {
    fetchLiveRates(convertFrom);
  }, [convertFrom]);

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
        ctx.shadowBlur = 0; 

        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.font = "10px sans-serif";
        ctx.fillText(p.label, p.x + 8, p.y + 3);

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

  // Bidirectional conversion handler
  const handleFromAmountChange = (amount: number) => {
    setConvertAmountFrom(amount);
    if (liveRatesMap && liveRatesMap[convertTo]) {
      setConvertAmountTo(Number((amount * liveRatesMap[convertTo]).toFixed(2)));
    } else {
      const converted = roundConversion(amount, convertFrom, convertTo);
      setConvertAmountTo(Number(converted));
    }
  };

  const handleToAmountChange = (amount: number) => {
    setConvertAmountTo(amount);
    if (liveRatesMap && liveRatesMap[convertTo]) {
      setConvertAmountFrom(Number((amount / liveRatesMap[convertTo]).toFixed(2)));
    } else {
      const converted = roundConversion(amount, convertTo, convertFrom);
      setConvertAmountFrom(Number(converted));
    }
  };

  const handleSwapCurrencies = () => {
    const tempCode = convertFrom;
    const tempSearch = searchFrom;
    setConvertFrom(convertTo);
    setSearchFrom(searchTo);
    setConvertTo(tempCode);
    setSearchTo(tempSearch);
    addToRecentlyUsed(convertTo, convertFrom);
  };

  useEffect(() => {
    handleFromAmountChange(convertAmountFrom);
  }, [convertFrom, convertTo, liveRatesMap]);

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
      // Simplify internal orchestrator message keywords for non-technical users
      if (data.message) {
        data.message = data.message
          .replace(/orchestrator/gi, "Lead Planner")
          .replace(/autonomous/gi, "automatic")
          .replace(/optimization/gi, "budget savings")
          .replace(/mission control/gi, "Dashboard")
          .replace(/specialized ai agents/gi, "travel assistants");
      }
      if (data.agent) {
        data.agent = data.agent.replace(/orchestrator/gi, "Lead Planner");
      }
      setAgentLogs((prev) => [...prev, data]);
      if (data.message === "Trip details synchronized successfully.") {
        fetchTripDetails(tripId);
      }
    };

    ws.onclose = () => {
      setWebsocketActive(false);
      if (agentLogs.length === 0) {
        const fallbacks: AgentLog[] = [
          { type: "Thought", agent: "Lead Planner", message: "Planning session initialized. Deploying assistants." },
          { type: "Thought", agent: "Visa Assistant", message: "Reviewing passport rules... US citizen does not require visa for stay under 90 days." },
          { type: "ToolCall", agent: "Flight Assistant", message: "Searching for flights from SFO to HND on 2026-10-15." },
          { type: "Thought", agent: "Weather Assistant", message: "Rain alert on Day 2 in Tokyo. Sending notice to Activity Planner." },
          { type: "Thought", agent: "Activity Planner", message: "Rain alert received. Moving outdoor tour to indoor museum." },
          { type: "Result", agent: "Lead Planner", message: "All travel plans compiled successfully." }
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
      let reply = "I have noted your request. I will coordinate with the relevant assistants to adjust your plan.";
      if (chatMessage.toLowerCase().includes("budget") || chatMessage.toLowerCase().includes("cheap")) {
        reply = "Budget Assistant: We can save $200 by choosing an alternative flight date on Wednesday.";
      } else if (chatMessage.toLowerCase().includes("weather") || chatMessage.toLowerCase().includes("rain")) {
        reply = "Weather Assistant: Rain is forecast for Day 3. I suggest visiting the Art Museum that day.";
      }
      setChatHistory((prev) => [...prev, { sender: "Lead Planner", text: reply }]);
    }, 1000);
  };

  // Scroll to how it works
  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Autocomplete country match
  const filteredCountries = countrySearch 
    ? COUNTRIES.filter(c => 
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.currency.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.currencyName.toLowerCase().includes(countrySearch.toLowerCase())
      )
    : COUNTRIES;

  const filteredHomeCountries = homeCountrySearch 
    ? COUNTRIES.filter(c => 
        c.name.toLowerCase().includes(homeCountrySearch.toLowerCase()) ||
        c.currency.toLowerCase().includes(homeCountrySearch.toLowerCase()) ||
        c.currencyName.toLowerCase().includes(homeCountrySearch.toLowerCase())
      )
    : COUNTRIES;

  const filteredFromCurrencies = searchFrom 
    ? COUNTRIES.filter(c => 
        c.name.toLowerCase().includes(searchFrom.toLowerCase()) ||
        c.currency.toLowerCase().includes(searchFrom.toLowerCase()) ||
        c.currencyName.toLowerCase().includes(searchFrom.toLowerCase())
      )
    : COUNTRIES;

  const filteredToCurrencies = searchTo 
    ? COUNTRIES.filter(c => 
        c.name.toLowerCase().includes(searchTo.toLowerCase()) ||
        c.currency.toLowerCase().includes(searchTo.toLowerCase()) ||
        c.currencyName.toLowerCase().includes(searchTo.toLowerCase())
      )
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

      {/* FULL SCREEN Educational Landing Page */}
      <AnimatePresence>
        {showLanding && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-0 bg-[#080c14] z-50 overflow-y-auto flex flex-col justify-between scroll-smooth"
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
                className="px-5 py-2.5 rounded-xl border border-indigo-500/30 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 font-semibold text-xs transition-all tracking-wider shadow-lg shadow-indigo-600/10 cursor-pointer min-h-[44px]"
              >
                Access Dashboard
              </button>
            </div>

            {/* SECTION 1: HERO */}
            <div className="max-w-7xl mx-auto w-full px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10 py-12">
              <div className="space-y-6 max-w-xl">
                <span className="px-3 py-1 text-2xs font-extrabold bg-indigo-600/10 text-indigo-300 border border-indigo-500/20 rounded-full uppercase tracking-widest">
                  ✈️ TravelMission AI
                </span>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] mt-2">
                  Your Personal AI <br />
                  <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-500 bg-clip-text text-transparent">Travel Mission Control</span>
                </h1>

                <p className="text-base text-slate-400 leading-relaxed">
                  Planning a trip shouldn't require opening 10 different websites. TravelMission AI brings everything together in one place. Our AI agents work as your personal travel team to help you plan flights, hotels, visas, budgets, weather, currency conversion, packing, safety, and local recommendations—all from a single request.
                </p>

                <div className="flex flex-wrap gap-4 pt-4">
                  <button 
                    onClick={() => setShowLanding(false)}
                    className="h-12 px-8 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center space-x-2 cursor-pointer min-h-[44px]"
                  >
                    <span>🚀 Start Planning</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  
                  <button 
                    onClick={scrollToHowItWorks}
                    className="h-12 px-8 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 font-bold text-sm tracking-wide transition-all flex items-center space-x-2 cursor-pointer min-h-[44px]"
                  >
                    <span>📖 Learn How It Works</span>
                  </button>
                </div>
              </div>

              {/* Glowing Canvas Globe */}
              <div className="w-full h-[300px] lg:h-[500px] relative flex items-center justify-center">
                <canvas ref={canvasRef} className="absolute z-0 w-full h-full max-w-[400px] max-h-[400px]" />
                
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

            {/* SECTION 2: WHY THIS APP? */}
            <div className="max-w-7xl mx-auto w-full px-6 py-20 relative z-10 border-t border-slate-800/80">
              <h2 className="text-2xl md:text-3xl font-black text-white text-center mb-12">Why TravelMission AI?</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Without App */}
                <div className="glass rounded-2xl p-6 border-rose-500/20 bg-rose-500/5">
                  <h3 className="font-extrabold text-sm text-rose-400 mb-4 flex items-center uppercase tracking-widest">
                    <span className="mr-2">❌</span> Without TravelMission AI
                  </h3>
                  <ul className="space-y-3.5 text-xs text-slate-400">
                    <li className="flex items-center"><span className="text-rose-500 mr-2 font-bold">✕</span> Open many websites to cross-reference logs</li>
                    <li className="flex items-center"><span className="text-rose-500 mr-2 font-bold">✕</span> Search flights separately in manual tabs</li>
                    <li className="flex items-center"><span className="text-rose-500 mr-2 font-bold">✕</span> Check passport and entry visa regulations on government pages</li>
                    <li className="flex items-center"><span className="text-rose-500 mr-2 font-bold">✕</span> Calculate trip budget ledger in standard sheets</li>
                    <li className="flex items-center"><span className="text-rose-500 mr-2 font-bold">✕</span> Convert foreign currency rates on active searches</li>
                    <li className="flex items-center"><span className="text-rose-500 mr-2 font-bold">✕</span> Check weather forecast alerts manually</li>
                    <li className="flex items-center"><span className="text-rose-500 mr-2 font-bold">✕</span> Plan day-by-day itineraries by hand</li>
                  </ul>
                </div>

                {/* With App */}
                <div className="glass rounded-2xl p-6 border-emerald-500/20 bg-emerald-500/5">
                  <h3 className="font-extrabold text-sm text-emerald-400 mb-4 flex items-center uppercase tracking-widest">
                    <span className="mr-2">✅</span> With TravelMission AI
                  </h3>
                  <ul className="space-y-3.5 text-xs text-slate-200 font-medium">
                    <li className="flex items-center"><span className="text-emerald-400 mr-2 font-bold">✓</span> Access all details from one central platform</li>
                    <li className="flex items-center"><span className="text-emerald-400 mr-2 font-bold">✓</span> AI travel assistants check flights in parallel</li>
                    <li className="flex items-center"><span className="text-emerald-400 mr-2 font-bold">✓</span> Automatic passport validity check and visa alerts</li>
                    <li className="flex items-center"><span className="text-emerald-400 mr-2 font-bold">✓</span> Budget is parsed, saved, and adjusted automatically</li>
                    <li className="flex items-center"><span className="text-emerald-400 mr-2 font-bold">✓</span> Dual currency toggles automatically calculate home rates</li>
                    <li className="flex items-center"><span className="text-emerald-400 mr-2 font-bold">✓</span> Weather warnings shift outdoor agenda blocks dynamically</li>
                    <li className="flex items-center"><span className="text-emerald-400 mr-2 font-bold">✓</span> Structured itineraries are rendered in clean timeline lists</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* SECTION 3: HOW IT WORKS */}
            <div ref={howItWorksRef} className="max-w-7xl mx-auto w-full px-6 py-20 relative z-10 border-t border-slate-800/80">
              <h2 className="text-2xl md:text-3xl font-black text-white text-center mb-12">How It Works</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 text-center text-xs">
                {[
                  { step: "Step 1", title: "📍 Enter destination", desc: "Type in your destination city or select it from our helper list." },
                  { step: "Step 2", title: "📅 Select dates", desc: "Input when you depart and return for custom agenda calculations." },
                  { step: "Step 3", title: "💰 Set budget", desc: "Select your max expenditure budget for flight/hotel check caps." },
                  { step: "Step 4", title: "🤖 Assistants Start Working", desc: "Our collaborative travel assistants cross-examine forecasts, rates, and hotels." },
                  { step: "Step 5", title: "📊 Mission Dashboard", desc: "Explore your structured budget charts, advisory index, and checklists." }
                ].map((s, idx) => (
                  <div key={idx} className="glass rounded-2xl p-6 border-slate-800 flex flex-col justify-between min-h-[160px] relative">
                    <div>
                      <span className="text-3xs text-indigo-400 uppercase tracking-widest font-extrabold">{s.step}</span>
                      <h4 className="font-extrabold text-white text-xs mt-2">{s.title}</h4>
                      <p className="text-slate-400 text-2xs mt-2 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 4: MEET YOUR AI TEAM */}
            <div className="max-w-7xl mx-auto w-full px-6 py-20 relative z-10 border-t border-slate-800/80">
              <h2 className="text-2xl md:text-3xl font-black text-white text-center mb-12">Meet Your AI Travel Assistants</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { name: "Flight Agent", desc: "Locates the best routing options." },
                  { name: "Hotel Agent", desc: "Suggests safety-vetted hotel properties." },
                  { name: "Visa Agent", desc: "Advises entry rules and checks passports." },
                  { name: "Weather Agent", desc: "Scans temperature forecasts and warnings." },
                  { name: "Budget Agent", desc: "Structures expense allocations." },
                  { name: "Currency Agent", desc: "Handles exchanges and live rates." },
                  { name: "Safety Agent", desc: "Reviews local advisory ratings." },
                  { name: "Language Agent", desc: "Translates menus and guides." },
                  { name: "Packing Agent", desc: "Compiles weather-appropriate checklists." },
                  { name: "Local Guide Agent", desc: "Curates dining spots and attractions." },
                  { name: "Transportation Agent", desc: "Aligns airport transfer shuttles." },
                  { name: "Activity Planner Agent", desc: "Builds day-by-day travel timelines." }
                ].map((member, idx) => (
                  <div key={idx} className="glass rounded-2xl p-5 border-slate-800 hover:border-indigo-500/20 transition-all text-center">
                    <h4 className="font-extrabold text-white text-xs">{member.name}</h4>
                    <p className="text-slate-400 text-2xs mt-2 leading-relaxed">{member.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 5: WHAT YOU GET */}
            <div className="max-w-7xl mx-auto w-full px-6 py-20 relative z-10 border-t border-slate-800/80">
              <h2 className="text-2xl md:text-3xl font-black text-white text-center mb-12">What You Get</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center text-xs">
                {[
                  { name: "Flights", desc: "Best options mapped." },
                  { name: "Hotels", desc: "Handpicked stays." },
                  { name: "Visa Guidance", desc: "Hassle-free entry checks." },
                  { name: "Currency Conversion", desc: "Exchange rate alerts." },
                  { name: "Weather", desc: "Forecast and warnings." },
                  { name: "Safety Alerts", desc: "Emergency information." },
                  { name: "Packing Checklist", desc: "Custom weather packing." },
                  { name: "Local Attractions", desc: "Restaurants & gems." },
                  { name: "Budget Planner", desc: "Clean ledger charts." },
                  { name: "Smart Itinerary", desc: "Day-by-day schedule." }
                ].map((feat, idx) => (
                  <div key={idx} className="glass rounded-2xl p-5 border-slate-800 flex flex-col justify-between min-h-[110px]">
                    <span className="font-bold text-white text-xs block">{feat.name}</span>
                    <span className="text-slate-400 text-3xs mt-1 block">{feat.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 6: WHY AI AGENTS? */}
            <div className="max-w-4xl mx-auto w-full px-6 py-20 relative z-10 border-t border-slate-800/80 text-center">
              <h2 className="text-2xl md:text-3xl font-black text-white mb-6">Why AI Travel Assistants?</h2>
              <p className="text-sm text-slate-300 leading-relaxed max-w-2xl mx-auto">
                Instead of one chatbot trying to do everything, TravelMission AI uses a team of specialized AI agents. Each agent focuses on one task and shares its results with the others. This makes planning faster, smarter, and more organized.
              </p>
            </div>

            {/* SECTION 7: HOW TO USE */}
            <div className="max-w-7xl mx-auto w-full px-6 py-20 relative z-10 border-t border-slate-800/80">
              <h2 className="text-2xl md:text-3xl font-black text-white text-center mb-12">Step-by-Step Onboarding</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4 text-center text-xs font-semibold">
                {[
                  { step: "1", title: "Click 'Start Planning'" },
                  { step: "2", title: "Enter destination" },
                  { step: "3", title: "Select travel dates" },
                  { step: "4", title: "Set your budget" },
                  { step: "5", title: "Upload tickets/docs" },
                  { step: "6", title: "Wait for assistants" },
                  { step: "7", title: "Explore dashboard!" }
                ].map((step, idx) => (
                  <div key={idx} className="glass rounded-xl p-4 border-slate-800 flex flex-col justify-between min-h-[100px]">
                    <span className="h-6 w-6 rounded-full bg-indigo-600/35 border border-indigo-500/20 text-white flex items-center justify-center mx-auto text-2xs font-extrabold">{step.step}</span>
                    <span className="text-2xs text-slate-200 mt-2 block">{step.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 8: FAQ */}
            <div className="max-w-3xl mx-auto w-full px-6 py-20 relative z-10 border-t border-slate-800/80">
              <h2 className="text-2xl md:text-3xl font-black text-white text-center mb-10">Frequently Asked Questions</h2>
              
              <div className="space-y-4 text-xs font-semibold">
                {[
                  { q: "What is TravelMission AI?", a: "TravelMission AI is an AI travel team planner that schedules itineraries, checks security ratings, validates entry requirements, and converts expenses instantly." },
                  { q: "How does it work?", a: "A lead planner coordinates with 12 specialized assistants to gather details and aggregate them into a single screen view." },
                  { q: "Why are AI agents better?", a: "Collaborative agents share context in parallel. If the weather agent spots rain, the planner shuffles your itineraries automatically." },
                  { q: "Can I change my destination later?", a: "Yes, you can edit or launch a new travel mission anytime from the dashboard panel." },
                  { q: "Does it work internationally?", a: "Absolutely. We support international travel destinations and automatically calculate foreign exchange conversions." },
                  { q: "How does currency conversion work?", a: "The currency assistant grabs current market rates and translates budget ledger cards into your local currency." },
                  { q: "Can I use it on mobile?", a: "Yes, the dashboard is fully responsive across mobile, tablet, and desktop screens." }
                ].map((faq, idx) => (
                  <div key={idx} className="border-b border-slate-800 pb-4">
                    <button 
                      onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                      className="w-full text-left font-bold text-white flex justify-between items-center py-2 cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${faqOpen === idx ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence>
                      {faqOpen === idx && (
                        <motion.p 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="text-slate-400 text-2xs leading-relaxed mt-2 overflow-hidden font-normal"
                        >
                          {faq.a}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 9: CALL TO ACTION */}
            <div className="max-w-5xl mx-auto w-full px-6 py-20 relative z-10 border-t border-slate-800/80 text-center">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">Ready for your next adventure?</h2>
              <p className="text-slate-400 text-sm mb-8">Let our AI travel team plan your journey.</p>
              
              <button 
                onClick={() => setShowLanding(false)}
                className="h-12 px-10 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all cursor-pointer min-h-[44px]"
              >
                🚀 Start Your Mission
              </button>
            </div>

            {/* Footer */}
            <div className="max-w-7xl mx-auto w-full px-6 py-6 border-t border-slate-800/80 text-center text-xs text-slate-500 relative z-10">
              © 2026 TravelMission AI Corp. Built for Kaggle AI Agents Capstone.
            </div>
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
              <p className="text-xs text-indigo-400 font-medium">Assistant Hub</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            {[
              { id: "dashboard", label: "Travel Dashboard", icon: Briefcase },
              { id: "trips", label: "My Trips", icon: MapPin },
              { id: "agents", label: "Travel Assistants", icon: Sparkles },
              { id: "documents", label: "Visa & Tickets", icon: FileText },
              { id: "budget", label: "Trip Budget", icon: DollarSign },
              { id: "currency", label: "Money Exchange", icon: ArrowRightLeft },
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
            <h4 className="text-sm font-semibold text-white">Traveler</h4>
            <p className="text-xs text-slate-500">ID: #4029-Alpha</p>
          </div>
        </div>
      </aside>

      {/* MAIN SCREEN */}
      <main className="flex-1 flex flex-col overflow-hidden pt-16 md:pt-0 z-10">
        
        {/* TOP NAV BAR */}
        <header className="hidden md:flex h-20 border-b border-slate-800/80 px-8 items-center justify-between bg-[#080c14]/50 backdrop-blur-md">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold tracking-tight text-white capitalize">{activeTab === "dashboard" ? "Travel Control" : activeTab} Panel</h2>
            
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
                      <p className="text-xs text-slate-400 mt-1">Autonomous travel assistant coordination. Trigger simulations below to observe real-time updates.</p>
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
                        <span>Active Assistant Status</span>
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
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">Trigger Collaboration Scenarios:</span>
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
                          <span className="text-slate-500 block text-2xs uppercase">Estimated Cost</span>
                          <span className="font-semibold text-white text-sm block">
                            {selectedTripDetails ? (
                              <>
                                <span>{formatCurrency(selectedTripDetails.budget_total, selectedTripDetails.currency)}</span>
                                {selectedTripDetails.home_currency && selectedTripDetails.home_currency !== selectedTripDetails.currency && (
                                  <span className="text-slate-400 text-xs font-normal block mt-0.5">
                                    ≈ {formatCurrency(
                                      selectedTripDetails.budget_logs?.reduce((acc, curr) => acc + (curr.cost_home_currency || curr.estimated_cost), 0) || (selectedTripDetails.budget_total * (liveRatesMap[selectedTripDetails.home_currency] || getStaticRate(selectedTripDetails.currency, selectedTripDetails.home_currency))),
                                      selectedTripDetails.home_currency
                                    )}
                                  </span>
                                )}
                              </>
                            ) : "$0"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-2xs uppercase">Assistants Active</span>
                          <span className="font-semibold text-white text-sm block">12 / 12</span>
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
                        <span>Lead Travel Planner</span>
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

            {/* TAB: MY TRIPS */}
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
                  <form onSubmit={handleCreateTrip} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    
                    {/* Searchable Home Country dropdown */}
                    <div className="relative">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Home Country</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="Search e.g. India" 
                          value={homeCountrySearch}
                          onChange={(e) => {
                            setHomeCountrySearch(e.target.value);
                            setShowHomeCountryDropdown(true);
                          }}
                          onFocus={() => setShowHomeCountryDropdown(true)}
                          className="w-full bg-slate-955 border border-slate-900 text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 text-white min-h-[44px]" 
                        />
                        <Search className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-500" />
                      </div>

                      <AnimatePresence>
                        {showHomeCountryDropdown && (
                          <motion.div 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute left-0 w-full mt-2 bg-[#0b0f19] border border-slate-800 rounded-xl max-h-[180px] overflow-y-auto z-30 shadow-2xl no-scrollbar animate-fade-in"
                          >
                            {filteredHomeCountries.length > 0 ? (
                              filteredHomeCountries.map((c, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setHomeCurrency(c.currency);
                                    setHomeCountrySearch(`${c.flag} ${c.name} (${c.currency})`);
                                    setShowHomeCountryDropdown(false);
                                  }}
                                  className="w-full text-left px-4 py-3 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white flex items-center space-x-2 min-h-[44px] cursor-pointer"
                                >
                                  <span>{c.flag}</span>
                                  <span>{c.name} ({c.currency})</span>
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-2xs text-slate-500 italic">No matching countries.</div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Searchable Destination Country dropdown */}
                    <div className="relative">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Destination Country</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="Search e.g. Japan" 
                          value={countrySearch}
                          onChange={(e) => {
                            setCountrySearch(e.target.value);
                            setShowCountryDropdown(true);
                          }}
                          onFocus={() => setShowCountryDropdown(true)}
                          className="w-full bg-slate-955 border border-slate-900 text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 text-white min-h-[44px]" 
                        />
                        <Search className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-500" />
                      </div>

                      <AnimatePresence>
                        {showCountryDropdown && (
                          <motion.div 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute left-0 w-full mt-2 bg-[#0b0f19] border border-slate-800 rounded-xl max-h-[180px] overflow-y-auto z-30 shadow-2xl no-scrollbar animate-fade-in"
                          >
                            {filteredCountries.length > 0 ? (
                              filteredCountries.map((c, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setDestination(c.name);
                                    setCountrySearch(`${c.flag} ${c.name} (${c.currency})`);
                                    setDestCurrency(c.currency);
                                    setShowCountryDropdown(false);
                                  }}
                                  className="w-full text-left px-4 py-3 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white flex items-center space-x-2 min-h-[44px] cursor-pointer"
                                >
                                  <span>{c.flag}</span>
                                  <span>{c.name} ({c.currency})</span>
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
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Total Budget</label>
                      <input 
                        type="number" 
                        value={budgetTotal} 
                        onChange={(e) => setBudgetTotal(Number(e.target.value))} 
                        className="w-full bg-slate-955 border border-slate-900 text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 text-white min-h-[44px]" 
                      />
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

                    <button 
                      type="submit" 
                      disabled={creatingTrip}
                      className="w-full h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold tracking-wider transition-all flex items-center justify-center space-x-2 shadow-md cursor-pointer"
                    >
                      <Plane className="h-4 w-4" />
                      <span>{creatingTrip ? "Launching..." : "Deploy Assistants"}</span>
                    </button>
                  </form>
                </div>

                {/* Missions List */}
                <div className="space-y-4">
                  <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-wider">Active Trips Ledger</h3>
                  
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

            {/* TAB: TRAVEL ASSISTANTS */}
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
                    <h3 className="font-extrabold text-lg text-white">Travel Assistant Hub</h3>
                    <p className="text-slate-400 text-xs mt-1">12 dedicated assistants operating concurrently via the Google Agent Development Kit (ADK).</p>
                  </div>
                  <span className="px-3 py-1 text-2xs font-extrabold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full uppercase tracking-widest animate-pulse">
                    Assistants Online
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { name: "Flight Assistant", icon: Plane, desc: "Queries global airline directories. Optimizes routes and captures price drops.", tools: "Browser, Flight API", speed: "140ms" },
                    { name: "Weather Assistant", icon: Cloud, desc: "Monitors global meteorology forecasts. Triggers warnings for outdoor agenda shifts.", tools: "Weather API", speed: "210ms" },
                    { name: "Visa Assistant", icon: Shield, desc: "Validates visa policies and reviews uploaded passports for expiry dates.", tools: "Filesystem MCP", speed: "180ms" },
                    { name: "Hotel Assistant", icon: Briefcase, desc: "Finds safety-certified lodgings and updates booking arrival check-ins.", tools: "Hotels MCP", speed: "250ms" },
                    { name: "Budget Assistant", icon: DollarSign, desc: "Maintains budget ledgers and executes currency updates for expense metrics.", tools: "Budget Calculation", speed: "90ms" },
                    { name: "Currency Assistant", icon: ArrowRightLeft, desc: "Evaluates daily exchange trends and flags lock-in money exchange signals.", tools: "Currency Service", speed: "110ms" },
                    { name: "Packing Assistant", icon: CheckSquare, desc: "Compiles weather-appropriate packing recommendations automatically.", tools: "PackingList Skill", speed: "120ms" },
                    { name: "Safety Assistant", icon: ShieldAlert, desc: "Vets advisory ratings, crime metrics, and generates emergency checklists.", tools: "Safety API", speed: "300ms" },
                    { name: "Language Assistant", icon: BookOpen, desc: "Translates menu logs and updates regional basic communication guides.", tools: "Translation MCP", speed: "150ms" },
                    { name: "Local Guide Assistant", icon: Compass, desc: "Curates dining selections, etiquette alerts, and hidden cultural guides.", tools: "LocalEtiquette Skill", speed: "170ms" },
                    { name: "Transportation Assistant", icon: Activity, desc: "Optimizes airport transfers and aligns shuttle slots with flight delays.", tools: "LocalTransport Skill", speed: "220ms" },
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

            {/* TAB: VISA & TICKETS */}
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
                      <p className="text-slate-400 text-xs">AI Visa Assistant automatically extracts validity, passport numbers, and country checklists.</p>
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
                      <span>Vault secured with local sandbox filesystem constraints.</span>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* TAB: TRIP BUDGET */}
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
                        <p className="text-slate-400 text-xs mt-0.5">Budget ledger compiled by Budget Assistant.</p>
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

            {/* TAB: MONEY EXCHANGE (CURRENCY INTEL) */}
            {activeTab === "currency" && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left: Redesigned Global Currency Converter */}
                  <div className="glass rounded-2xl p-6 col-span-1 lg:col-span-2 flex flex-col justify-between relative min-h-[480px]">
                    <div>
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h3 className="font-bold text-base text-white">Global Currency Converter</h3>
                          <p className="text-slate-400 text-xs mt-1">Convert between any official currency in the world. Rates update automatically.</p>
                        </div>
                        {ratesLastUpdated && (
                          <span className="text-3xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg font-bold">
                            Live Rates (Updated {ratesLastUpdated})
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-9 gap-4 items-center">
                        {/* FROM Selector */}
                        <div className="col-span-1 md:col-span-4 relative">
                          <label className="text-3xs text-slate-500 uppercase tracking-widest font-bold block mb-1">Convert From</label>
                          <div className="relative">
                            <input 
                              type="text" 
                              placeholder="Search e.g. India, Rupee, INR"
                              value={searchFrom || convertFrom}
                              onChange={(e) => {
                                setSearchFrom(e.target.value);
                                setShowFromList(true);
                              }}
                              onFocus={() => setShowFromList(true)}
                              className="w-full bg-slate-950 border border-slate-900 text-xs px-4 py-3 rounded-xl focus:outline-none text-white min-h-[44px]"
                            />
                            <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-slate-500" />
                          </div>
                          
                          <AnimatePresence>
                            {showFromList && (
                              <motion.div 
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="absolute left-0 w-full mt-2 bg-[#0b0f19] border border-slate-800 rounded-xl max-h-[180px] overflow-y-auto z-30 shadow-2xl no-scrollbar"
                              >
                                {filteredFromCurrencies.map((c, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      setConvertFrom(c.currency);
                                      setSearchFrom(`${c.flag} ${c.name} (${c.currency})`);
                                      setShowFromList(false);
                                      addToRecentlyUsed(c.currency, convertTo);
                                    }}
                                    className="w-full text-left px-4 py-3 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white min-h-[44px] cursor-pointer flex items-center space-x-2"
                                  >
                                    <span>{c.flag}</span>
                                    <div className="flex-1">
                                      <div className="font-bold text-white text-xs">{c.name}</div>
                                      <div className="text-3xs text-slate-400">{c.currencyName} ({c.currency})</div>
                                    </div>
                                    <span className="text-xs text-slate-500 font-mono font-bold">{c.symbol}</span>
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="mt-3">
                            <input 
                              type="number" 
                              value={convertAmountFrom}
                              onChange={(e) => handleFromAmountChange(Number(e.target.value))}
                              className="w-full bg-slate-955 border border-slate-900 text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 text-white min-h-[44px]"
                            />
                          </div>
                        </div>

                        {/* SWAP CURRENCIES BUTTON */}
                        <div className="col-span-1 flex justify-center pt-4 md:pt-0">
                          <button
                            type="button"
                            onClick={handleSwapCurrencies}
                            className="p-3 rounded-full bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-600/20 hover:text-white transition-all cursor-pointer shadow-lg min-h-[44px]"
                          >
                            <ArrowRightLeft className="h-5 w-5 rotate-90 md:rotate-0" />
                          </button>
                        </div>

                        {/* TO Selector */}
                        <div className="col-span-1 md:col-span-4 relative">
                          <label className="text-3xs text-slate-500 uppercase tracking-widest font-bold block mb-1">Convert To</label>
                          <div className="relative">
                            <input 
                              type="text" 
                              placeholder="Search e.g. Japan, JPY"
                              value={searchTo || convertTo}
                              onChange={(e) => {
                                setSearchTo(e.target.value);
                                setShowToList(true);
                              }}
                              onFocus={() => setShowToList(true)}
                              className="w-full bg-slate-955 border border-slate-900 text-xs px-4 py-3 rounded-xl focus:outline-none text-white min-h-[44px]"
                            />
                            <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-slate-500" />
                          </div>

                          <AnimatePresence>
                            {showToList && (
                              <motion.div 
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="absolute left-0 w-full mt-2 bg-[#0b0f19] border border-slate-800 rounded-xl max-h-[180px] overflow-y-auto z-30 shadow-2xl no-scrollbar"
                              >
                                {filteredToCurrencies.map((c, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      setConvertTo(c.currency);
                                      setSearchTo(`${c.flag} ${c.name} (${c.currency})`);
                                      setShowToList(false);
                                      addToRecentlyUsed(convertFrom, c.currency);
                                    }}
                                    className="w-full text-left px-4 py-3 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white min-h-[44px] cursor-pointer flex items-center space-x-2"
                                  >
                                    <span>{c.flag}</span>
                                    <span>{c.name} ({c.currency} {c.symbol})</span>
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="mt-3">
                            <input 
                              type="number" 
                              value={convertAmountTo}
                              onChange={(e) => handleToAmountChange(Number(e.target.value))}
                              className="w-full bg-slate-955 border border-slate-900 text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 text-white min-h-[44px]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Display live exchange rate quote */}
                      {liveRatesMap[convertTo] && (
                        <div className="mt-6 p-4 rounded-xl border border-indigo-500/10 bg-indigo-500/5 text-xs text-indigo-300 font-semibold flex justify-between items-center">
                          <span>1 {convertFrom} = {liveRatesMap[convertTo].toFixed(4)} {convertTo}</span>
                          <span className="text-slate-500 text-3xs font-medium">Last updated {ratesLastUpdated || "Just now"}</span>
                        </div>
                      )}

                      {/* Popular Currencies quick actions */}
                      <div className="mt-6 space-y-2">
                        <label className="text-3xs text-slate-500 uppercase tracking-widest font-bold block">Popular Currencies</label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { name: "India", code: "INR", flag: "🇮🇳" },
                            { name: "United States", code: "USD", flag: "🇺🇸" },
                            { name: "Eurozone", code: "EUR", flag: "🇪🇺" },
                            { name: "United Kingdom", code: "GBP", flag: "🇬🇧" },
                            { name: "Japan", code: "JPY", flag: "🇯🇵" },
                            { name: "UAE", code: "AED", flag: "🇦🇪" },
                            { name: "Canada", code: "CAD", flag: "🇨🇦" },
                            { name: "Australia", code: "AUD", flag: "🇦🇺" }
                          ].map((pop, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setConvertTo(pop.code);
                                setSearchTo(`${pop.flag} ${pop.name} (${pop.code})`);
                                addToRecentlyUsed(convertFrom, pop.code);
                              }}
                              className="px-3.5 py-1.5 rounded-lg border border-slate-800 bg-[#090d16]/60 text-slate-300 hover:border-indigo-500/40 hover:text-white transition-all text-xs flex items-center space-x-1.5 min-h-[44px] cursor-pointer"
                            >
                              <span>{pop.flag}</span>
                              <span className="font-semibold">{pop.code}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Recently Used Pairs */}
                      {recentlyUsed.length > 0 && (
                        <div className="mt-6 space-y-2">
                          <label className="text-3xs text-slate-500 uppercase tracking-widest font-bold block">Recently Used Pairs</label>
                          <div className="flex flex-wrap gap-2">
                            {recentlyUsed.map((pair, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setConvertFrom(pair.from);
                                  const fromCountry = COUNTRIES.find(c => c.currency === pair.from);
                                  setSearchFrom(fromCountry ? `${fromCountry.flag} ${fromCountry.name} (${pair.from})` : pair.from);

                                  setConvertTo(pair.to);
                                  const toCountry = COUNTRIES.find(c => c.currency === pair.to);
                                  setSearchTo(toCountry ? `${toCountry.flag} ${toCountry.name} (${pair.to})` : pair.to);
                                }}
                                className="px-3 py-1.5 rounded-lg border border-slate-800/80 bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:border-slate-700 text-xs min-h-[44px] cursor-pointer"
                              >
                                {pair.from} → {pair.to}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Area Chart & Quick conversions reference list */}
                  <div className="col-span-1 space-y-6">
                    {/* Live Area Graph */}
                    <div className="glass rounded-2xl p-6 h-[230px] flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-xs text-white">Live Rate Trend Graph</h4>
                        <span className="text-3xs text-slate-500 block mt-0.5">{convertFrom} relative to {convertTo} fluctuation</span>
                      </div>
                      
                      <div className="h-[120px] w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={currencyRates?.trends?.weekly_trend || mockWeeklyTrend}>
                            <defs>
                              <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="day" stroke="#475569" fontSize={8} tickLine={false} />
                            <YAxis stroke="#475569" fontSize={8} domain={['auto', 'auto']} tickLine={false} />
                            <Tooltip formatter={(value) => [`${value}`, 'Rate']} contentStyle={{ backgroundColor: "#0b0f19", borderColor: "#1e293b", borderRadius: "8px", fontSize: "10px" }} />
                            <Area type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={1.5} fillOpacity={1} fill="url(#colorRate)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Quick conversions reference list */}
                    <div className="glass rounded-2xl p-6 h-[230px] flex flex-col justify-between">
                      <h4 className="font-bold text-xs text-white">Quick Conversions Ledger</h4>
                      <div className="space-y-2 mt-2 max-h-[140px] overflow-y-auto no-scrollbar text-2xs">
                        {[1, 5, 10, 50, 100, 250].map((unit, idx) => {
                          const converted = liveRatesMap[convertTo] ? (unit * liveRatesMap[convertTo]).toFixed(2) : (unit * getStaticRate(convertFrom, convertTo)).toFixed(2);
                          return (
                            <div key={idx} className="flex justify-between items-center border-b border-slate-900/60 pb-1.5 last:border-0 last:pb-0">
                              <span className="text-slate-400 font-mono">{unit} {convertFrom}</span>
                              <span className="text-white font-bold font-mono">{converted} {convertTo}</span>
                            </div>
                          );
                        })}
                      </div>
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
  function getStaticRate(from: string, to: string) {
    if (from === to) return 1.0;
    const rates: any = {
      USD: { EUR: 0.92, JPY: 155.4, INR: 83.5, GBP: 0.79, AUD: 1.51, CAD: 1.36, AED: 3.67 },
      EUR: { USD: 1.09, JPY: 168.9, INR: 90.7, GBP: 0.86, AUD: 1.64, CAD: 1.48, AED: 4.0 },
      JPY: { USD: 0.0064, EUR: 0.0059, INR: 0.54, GBP: 0.0051, AUD: 0.0097 },
      INR: { USD: 0.012, EUR: 0.011, JPY: 1.86, GBP: 0.0095, AUD: 0.018 },
      GBP: { USD: 1.27, EUR: 1.16, JPY: 196.7, INR: 105.3, AUD: 1.91 },
      AUD: { USD: 0.66, EUR: 0.61, JPY: 102.9, INR: 55.2, GBP: 0.52 },
      CAD: { USD: 0.74, EUR: 0.68, JPY: 114.2, INR: 61.4, GBP: 0.58 }
    };
    
    if (rates[from]?.[to]) return rates[from][to];
    if (rates[to]?.[from]) return 1 / rates[to][from];
    
    // Default fallback approximations via USD base rates
    const usdBase: any = {
      USD: 1.0, EUR: 0.92, GBP: 0.79, JPY: 155.4, INR: 83.5, AUD: 1.51, CAD: 1.36, CHF: 0.89, CNY: 7.25, KRW: 1380, SGD: 1.35, AED: 3.67, QAR: 3.64, SAR: 3.75, THB: 36.6, MYR: 4.71, NZD: 1.63
    };
    
    const fromUSD = usdBase[from] || 1.0;
    const toUSD = usdBase[to] || 1.0;
    return toUSD / fromUSD;
  }

  function roundConversion(amount: number, from: string, to: string) {
    return (amount * getStaticRate(from, to)).toFixed(2);
  }
}
