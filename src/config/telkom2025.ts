import type {
  AreaName,
  ProblemAreaMeta,
  ScenarioCalibration,
  SegmentName,
  ServiceTypeName,
} from "../types/telemetry";

export const TELKOM_COLORS = {
  red: "#E00000",
  crimson: "#A60000",
  darkCrimson: "#7A0000",
  slate: "#2C3E50",
  slateLight: "#64748B",
  coolGray: "#94A3B8",
  amber: "#D97706",
  emerald: "#059669",
  blue: "#1D4ED8",
  surface: "#FFFFFF",
  canvas: "#F7F8FA",
  border: "#E2E8F0",
} as const;

export const AREAS: AreaName[] = [
  "Area 1 (Sumatera)",
  "Area 2 (Jabotabek & Jabar)",
  "Area 3 (Jawa, Bali & Nusra)",
  "Area 4 (Pamasuka)",
];

export const SEGMENTS: SegmentName[] = ["B2C", "B2B"];

export const SERVICE_TYPES: ServiceTypeName[] = [
  "Mobile Data",
  "Voice",
  "SMS",
  "IndiHome Fixed BB",
  "Digital & Enterprise",
];

export const DEFAULT_CALIBRATION: ScenarioCalibration = {
  voiceYoYPct: -30.4,
  smsYoYPct: -17.1,
  subs2025M: 156.1,
};

export const BASELINE_SUBS_2024_M = 159.4;

export const PROBLEM_AREAS: ProblemAreaMeta[] = [
  {
    id: "legacy-decline",
    index: "01",
    title: "B2C & Legacy Revenue Decline",
    shortLabel: "Legacy Decline",
    severity: "Critical",
    headlineMetric: "Voice -30.4% · SMS -17.1% YoY",
    summary:
      "Rapid OTT substitution (WhatsApp, Telegram, VoIP) drove a -30.4% YoY collapse in Voice revenue and -17.1% YoY drop in SMS revenue, compressing high-margin legacy EBITDA.",
    kpiFocus: "Legacy Revenue Share, Data Monetization Yield (Rp/GB), Digital Services Growth",
  },
  {
    id: "subscriber-churn",
    index: "02",
    title: "Mobile Subscriber Churn",
    shortLabel: "Subscriber Churn",
    severity: "Critical",
    headlineMetric: "159.4M → 156.1M (-3.3M Subs)",
    summary:
      "Mobile subscriber base contracted by 3.3M (-2.07% YoY) from 159.4M to 156.1M driven by rotational SIM churn, price-sensitive downgrading, and aggressive competitor starter packs.",
    kpiFocus: "Monthly Churn Rate, Net Adds, Customer Lifetime Value (CLV)",
  },
  {
    id: "market-competition",
    index: "03",
    title: "Market Competition & Consolidation",
    shortLabel: "Market Competition",
    severity: "High",
    headlineMetric: "XLSmart Merger · IOH · e-SIM",
    summary:
      "Post-merger XLSmart scale, Indosat Ooredoo Hutchison (IOH) aggressive data pricing, and frictionless e-SIM dual-profile switching are compressing Telkomsel's historic price premium.",
    kpiFocus: "Revenue Market Share (RMS), Pricing Premium Index, e-SIM Retention Rate",
  },
  {
    id: "5g-bottlenecks",
    index: "04",
    title: "5G Network Expansion Bottlenecks",
    shortLabel: "5G Bottlenecks",
    severity: "High",
    headlineMetric: "0 MHz at 3.5 GHz · High CAPEX",
    summary:
      "Unavailability of dedicated 3.5 GHz mid-band spectrum forces reliance on 2.3 GHz/2.1 GHz refarming while 5G RAN CAPEX intensity rises faster than near-term 5G ARPU uplift.",
    kpiFocus: "5G Population Coverage %, CAPEX-to-Revenue Ratio, 5G Traffic Offload %",
  },
  {
    id: "infra-subsea-risk",
    index: "05",
    title: "High Infrastructure Costs & Subsea Cable Vulnerability",
    shortLabel: "Infra & Subsea Risk",
    severity: "High",
    headlineMetric: "Up to 4.35x 3T Cost · SMPCS Cuts",
    summary:
      "Deploying and maintaining backhaul in 3T (Terdepan, Terluar, Tertinggal) regions incurs 2.8x–4.35x unit costs, compounded by physical subsea cable disruptions across eastern corridors.",
    kpiFocus: "Network Availability %, Mean Time to Repair (MTTR), 3T Site OpEx-to-Revenue",
  },
  {
    id: "indihome-arpu",
    index: "06",
    title: "IndiHome ARPU Erosion",
    shortLabel: "IndiHome ARPU",
    severity: "Medium-High",
    headlineMetric: "1P Mix 38% → 61.5% · ARPU -12.8%",
    summary:
      "Cord-cutting and budget-conscious households are shifting from high-ARPU 3P/IPTV bundles to lower-margin 1P internet-only plans, compressing blended Fixed Broadband ARPU.",
    kpiFocus: "IndiHome Blended ARPU, 3P/FMC Penetration %, Telkomsel One Attach Rate",
  },
  {
    id: "macro-pressures",
    index: "07",
    title: "Macroeconomic Pressures",
    shortLabel: "Macro Pressures",
    severity: "Medium-High",
    headlineMetric: "BI Rate 5.5–6.25% · Soft Wallet",
    summary:
      "Elevated Bank Indonesia benchmark interest rates raise debt servicing costs while softer middle-class purchasing power drives smaller reload denominations and shorter validity packs.",
    kpiFocus: "Average Reload Denomination, Debt Service Coverage, Wallet Share Elasticity",
  },
];

export const CONSTRAINT_PRESETS: string[] = [
  "Keep CAPEX-to-Revenue strictly below 22% in FY2026.",
  "Prioritize Area 2 & Area 3 retention against XLSmart aggressive starter packs.",
  "Evaluate LEO satellite backup (Starlink/OneWeb) for Papua & Maluku 3T corridors.",
  "Accelerate Telkomsel One FMC migration from IndiHome 1P households.",
];
