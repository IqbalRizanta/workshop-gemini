export type AreaName =
  | "Area 1 (Sumatera)"
  | "Area 2 (Jabotabek & Jabar)"
  | "Area 3 (Jawa, Bali & Nusra)"
  | "Area 4 (Pamasuka)";

export type SegmentName = "B2C" | "B2B";

export type ServiceTypeName =
  | "Mobile Data"
  | "Voice"
  | "SMS"
  | "IndiHome Fixed BB"
  | "Digital & Enterprise";

export type TimeRangeOption = "2024 vs 2025 (YoY)" | "2025 Only" | "2024 Only";

export type DataSourceMode = "calibrated" | "uploaded";

export type DashboardTabId =
  | "executive"
  | "revenue"
  | "simulator"
  | "infrastructure"
  | "ai-strategy";

export interface OperationalRecord {
  date: string; // YYYY-MM-01
  year: number;
  month: number;
  quarter: string;
  area: AreaName;
  segment: SegmentName;
  serviceType: ServiceTypeName;
  revenueIdrB: number;
  mobileSubsM: number;
  indihomeSubsM: number;
  arpuIdrK: number | null;
  coverage5GPct: number;
  churnRatePct: number;
}

export interface ScenarioCalibration {
  voiceYoYPct: number;
  smsYoYPct: number;
  subs2025M: number;
}

export interface FilterState {
  areas: AreaName[];
  segments: SegmentName[];
  services: ServiceTypeName[];
  timeRange: TimeRangeOption;
}

export interface KpiSnapshot {
  revenue2025T: number;
  revenue2024T: number;
  revenueYoYPct: number;
  mobileSubs2025M: number;
  mobileSubs2024M: number;
  mobileSubsDeltaM: number;
  mobileSubsYoYPct: number;
  arpu2025K: number;
  arpuYoYPct: number;
  coverage5G2025Pct: number;
  coverage5GDeltaPp: number;
  churn2025Pct: number;
  churnDeltaPp: number;
  voiceYoYPct: number;
  smsYoYPct: number;
}

export interface IndiHomeQuarterPoint {
  quarter: string;
  year: number;
  plan1PPct: number;
  plan2PPct: number;
  plan3PIptvPct: number;
  blendedArpuK: number;
  totalSubsM: number;
}

export interface CompetitionQuarterPoint {
  quarter: string;
  telkomselSharePct: number;
  xlSmartSharePct: number;
  iohSharePct: number;
  telkomselYieldRpGb: number;
  competitorAvgYieldRpGb: number;
}

export interface MacroQuarterPoint {
  quarter: string;
  biRatePct: number;
  purchasingPowerIndex: number;
  esimAdoptionPct: number;
  ottPenetrationPct: number;
}

export interface RegionalClusterRisk {
  cluster: string;
  area: AreaName;
  tier: "Urban Core" | "Strategic Growth" | "Semi-Urban" | "3T / Frontier";
  capexIdrT: number;
  roiPct: number;
  coverage5GPct: number;
  costMultiplier3T: number;
  subscribersM: number;
}

export interface SubseaCableRisk {
  corridor: string;
  area: AreaName;
  subseaRiskScore: number;
  deployment3TCostIndex: number;
  outages24M: number;
  avgRepairDays: number;
  primaryThreat: string;
}

export interface ProblemAreaMeta {
  id: string;
  index: string;
  title: string;
  shortLabel: string;
  severity: "Critical" | "High" | "Medium-High";
  headlineMetric: string;
  summary: string;
  kpiFocus: string;
}

export interface OttProjectionPoint {
  year: string;
  legacyIdrT: number;
  dataDigitalIdrT: number;
  legacySharePct: number;
}

export interface RetentionSimPoint {
  monthLabel: string;
  baselineSubsM: number;
  simulatedSubsM: number;
  baselineMobArpuK: number;
  simulatedMobArpuK: number;
  baselineIndiHomeArpuK: number;
  simulatedIndiHomeArpuK: number;
}

export interface RetentionSimResult {
  series: RetentionSimPoint[];
  target2024SubsM: number;
  projectedSubsM12: number;
  subsVsBaselineM12: number;
  netRevenueUpliftT: number;
  mobileArpuM12K: number;
  mobileArpuChangePct: number;
  indihomeArpuM12K: number;
  indihomeArpuChangePct: number;
}

export interface AiMitigationStep {
  stepNumber: number;
  horizon: string;
  title: string;
  lever: string;
  actions: string[];
}

export interface AiTimelineRow {
  phase: string;
  quarter: string;
  deliverables: string;
  owner: string;
}

export interface AiRoiForecast {
  revenueImpactIdrT: string;
  ebitdaMarginBps: string;
  estimatedRoiMultiple: string;
  paybackPeriod: string;
  riskGuardrails: string[];
}

export interface AiStrategyPlan {
  executiveSummary: string;
  rootCauseDiagnosis: string[];
  mitigationSteps: AiMitigationStep[];
  executionTimeline: AiTimelineRow[];
  roiForecast: AiRoiForecast;
}
