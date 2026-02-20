export const TRUCK_MAKES = [
  "Freightliner",
  "Peterbilt",
  "Kenworth",
  "Volvo",
  "International",
  "Mack",
  "Western Star",
  "Navistar",
] as const;

export const ENGINE_MAKES = [
  "Cummins",
  "Detroit Diesel",
  "PACCAR",
  "Volvo",
  "Navistar",
  "Caterpillar",
] as const;

export const LISTING_FEE_STANDARD = 9900; // $99 in cents
export const LISTING_FEE_FEATURED = 29900; // $299 in cents
export const BUYER_PREMIUM_RATE = 0.05; // 5%
export const BUYER_PREMIUM_CAP = 500000; // $5,000 in cents
export const INSPECTION_BASIC_PRICE = 24900; // $249
export const INSPECTION_COMPREHENSIVE_PRICE = 74900; // $749
export const INSPECTION_COMMISSION_RATE = 0.2; // 20%
export const DEFAULT_AUCTION_DURATION_DAYS = 7;
export const ANTI_SNIPE_WINDOW_MS = 2 * 60 * 1000; // 2 minutes
export const ANTI_SNIPE_EXTENSION_MS = 2 * 60 * 1000; // 2 minutes

export const REQUIRED_PHOTO_CATEGORIES = [
  { key: "EXTERIOR_FRONT", label: "Exterior — Front", description: "Straight-on, full truck visible" },
  { key: "EXTERIOR_REAR", label: "Exterior — Rear", description: "Full rear view" },
  { key: "EXTERIOR_DRIVER_SIDE", label: "Exterior — Driver Side", description: "Full profile" },
  { key: "EXTERIOR_PASSENGER_SIDE", label: "Exterior — Passenger Side", description: "Full profile" },
  { key: "ENGINE_BAY", label: "Engine Bay", description: "Hood up, clear shot of engine" },
  { key: "FRAME_RAILS", label: "Frame Rails", description: "Underside, both sides if possible" },
  { key: "FIFTH_WHEEL", label: "Fifth Wheel", description: "Close-up showing wear/condition" },
  { key: "CAB_INTERIOR", label: "Cab Interior", description: "Wide shot of dash and seats" },
  { key: "DASHBOARD", label: "Dashboard / Gauges / Odometer", description: "Clear, readable" },
  { key: "TIRES_FRONT", label: "Tires — Front", description: "Showing tread depth" },
  { key: "TIRES_REAR", label: "Tires — Rear", description: "Showing tread depth" },
  { key: "DOT_STICKER", label: "DOT Inspection Sticker", description: "Current sticker, legible" },
  { key: "DAMAGE_DOCUMENTATION", label: "Damage Documentation", description: "If no damage, confirm and upload cleanest angle" },
] as const;

export const OPTIONAL_PHOTO_CATEGORIES = [
  { key: "SLEEPER", label: "Sleeper", description: "Interior shot (if equipped)" },
  { key: "UNDERCARRIAGE", label: "Undercarriage", description: "Additional underside photos" },
  { key: "GAUGES_ODOMETER", label: "Gauges / Odometer", description: "Additional gauge photos" },
  { key: "MAINTENANCE_DOCS", label: "Maintenance Documents", description: "Oil analysis, ECM printouts, etc." },
  { key: "OTHER", label: "Other", description: "Any additional photos" },
] as const;

export const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
] as const;
