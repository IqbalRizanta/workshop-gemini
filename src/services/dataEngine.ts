import {
  AREAS,
  BASELINE_SUBS_2024_M,
  DEFAULT_CALIBRATION,
  SEGMENTS,
  SERVICE_TYPES,
} from "../config/telkom2025";
import type {
  AreaName,
  CompetitionQuarterPoint,
  FilterState,
  IndiHomeQuarterPoint,
  KpiSnapshot,
  MacroQuarterPoint,
  OperationalRecord,
  RegionalClusterRisk,
  ScenarioCalibration,
  SegmentName,
  ServiceTypeName,
  SubseaCableRisk,
} from "../types/telemetry";

// Deterministic PRNG (Mulberry32) so synthetic telemetry is reproducible across renders
function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalNoise(rand: () => number, std = 0.05): number {
  const u1 = Math.max(1e-7, rand());
  const u2 = rand();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * std;
}

const AREA_WEIGHTS: Record<AreaName, number> = {
  "Area 1 (Sumatera)": 0.245,
  "Area 2 (Jabotabek & Jabar)": 0.265,
  "Area 3 (Jawa, Bali & Nusra)": 0.27,
  "Area 4 (Pamasuka)": 0.22,
};

const AREA_5G_BASE: Record<AreaName, [number, number]> = {
  "Area 1 (Sumatera)": [11.0, 15.6],
  "Area 2 (Jabotabek & Jabar)": [24.5, 33.4],
  "Area 3 (Jawa, Bali & Nusra)": [15.2, 20.8],
  "Area 4 (Pamasuka)": [6.8, 9.2],
};

const AREA_CHURN_BASE: Record<AreaName, [number, number]> = {
  "Area 1 (Sumatera)": [2.3, 2.75],
  "Area 2 (Jabotabek & Jabar)": [2.75, 3.35],
  "Area 3 (Jawa, Bali & Nusra)": [2.6, 3.1],
  "Area 4 (Pamasuka)": [2.05, 2.38],
};

const AREA_FIXED_TILT: Record<AreaName, number> = {
  "Area 1 (Sumatera)": 0.92,
  "Area 2 (Jabotabek & Jabar)": 1.24,
  "Area 3 (Jawa, Bali & Nusra)": 1.06,
  "Area 4 (Pamasuka)": 0.72,
};

const BASE_REV_2024: Record<string, number> = {
  "B2C|Mobile Data": 69500,
  "B2C|Voice": 12800,
  "B2C|SMS": 3400,
  "B2C|IndiHome Fixed BB": 26800,
  "B2C|Digital & Enterprise": 4900,
  "B2B|Mobile Data": 6200,
  "B2B|Voice": 1900,
  "B2B|SMS": 1100,
  "B2B|IndiHome Fixed BB": 3400,
  "B2B|Digital & Enterprise": 19200,
};

const RAW_SEASONALITY = [0.97, 0.95, 1.03, 1.06, 1.0, 0.99, 1.01, 1.0, 0.98, 0.99, 0.99, 1.03];
const MEAN_SEASONALITY = RAW_SEASONALITY.reduce((a, b) => a + b, 0) / RAW_SEASONALITY.length;
const SEASONALITY = RAW_SEASONALITY.map((v) => v / MEAN_SEASONALITY);

export function generateCoreOperationalData(
  calibration: ScenarioCalibration = DEFAULT_CALIBRATION,
  seed = 2025
): OperationalRecord[] {
  const rand = createSeededRandom(seed);
  const voiceMult = Math.max(0.05, 1 + calibration.voiceYoYPct / 100);
  const smsMult = Math.max(0.05, 1 + calibration.smsYoYPct / 100);

  const yoyRevFactor: Record<string, number> = {
    "B2C|Mobile Data": 1.036,
    "B2C|Voice": voiceMult,
    "B2C|SMS": smsMult,
    "B2C|IndiHome Fixed BB": 0.985,
    "B2C|Digital & Enterprise": 1.095,
    "B2B|Mobile Data": 1.042,
    "B2B|Voice": voiceMult,
    "B2B|SMS": smsMult,
    "B2B|IndiHome Fixed BB": 1.035,
    "B2B|Digital & Enterprise": 1.078,
  };

  const churnShift = Math.max(-0.5, (BASELINE_SUBS_2024_M - calibration.subs2025M) * 0.08);
  const records: OperationalRecord[] = [];

  for (const year of [2024, 2025]) {
    for (let month = 1; month <= 12; month++) {
      const mm = String(month).padStart(2, "0");
      const date = `${year}-${mm}-01`;
      const quarter = `Q${Math.floor((month - 1) / 3) + 1} ${year}`;
      const seas = SEASONALITY[month - 1];

      const totalMobileSubsM =
        year === 2024
          ? BASELINE_SUBS_2024_M + (month - 6.5) * -0.06
          : calibration.subs2025M + (month - 6.5) * -0.18;

      for (const area of AREAS) {
        const wArea = AREA_WEIGHTS[area];
        const [cov24, cov25] = AREA_5G_BASE[area];
        const cov5G = year === 2024 ? cov24 + (month - 1) * 0.15 : cov25 + (month - 1) * 0.22;

        const [ch24, ch25] = AREA_CHURN_BASE[area];
        const churnRate =
          year === 2024
            ? ch24 + normalNoise(rand, 0.05)
            : ch25 - 0.26 + churnShift + (month - 6) * 0.015 + normalNoise(rand, 0.05);

        for (const segment of SEGMENTS) {
          const segSubShare = segment === "B2C" ? 0.93 : 0.07;

          for (const serviceType of SERVICE_TYPES) {
            const key = `${segment}|${serviceType}`;
            const baseAnnual = BASE_REV_2024[key];
            const factor = year === 2024 ? 1.0 : yoyRevFactor[key];

            let areaRevMult = wArea;
            if (serviceType === "IndiHome Fixed BB" || serviceType === "Digital & Enterprise") {
              areaRevMult = wArea * AREA_FIXED_TILT[area];
            }

            const revenueIdrB = (baseAnnual / 12) * factor * areaRevMult * seas;
            const mobileSubsM =
              serviceType === "Mobile Data" ? totalMobileSubsM * wArea * segSubShare : 0;
            const indihomeSubsM =
              serviceType === "IndiHome Fixed BB"
                ? (year === 2024 ? 10.1 : 10.82) * areaRevMult * (segment === "B2C" ? 0.91 : 0.09)
                : 0;

            let arpuIdrK: number | null = null;
            if (serviceType === "Mobile Data") {
              const baseArpu = (year === 2024 ? 46.8 : 44.6) * (segment === "B2B" ? 1.48 : 1.0);
              arpuIdrK = Number((baseArpu * (1 + (wArea - 0.25) * 0.4)).toFixed(2));
            } else if (serviceType === "IndiHome Fixed BB") {
              arpuIdrK = Number(
                ((year === 2024 ? 254.0 : 233.5) * (segment === "B2B" ? 1.22 : 1.0)).toFixed(2)
              );
            }

            records.push({
              date,
              year,
              month,
              quarter,
              area,
              segment,
              serviceType,
              revenueIdrB: Number(revenueIdrB.toFixed(2)),
              mobileSubsM: Number(mobileSubsM.toFixed(4)),
              indihomeSubsM: Number(indihomeSubsM.toFixed(4)),
              arpuIdrK,
              coverage5GPct: Number(cov5G.toFixed(2)),
              churnRatePct: Number(Math.max(0.8, churnRate).toFixed(2)),
            });
          }
        }
      }
    }
  }

  // Exact calibration for Voice and SMS YoY
  const targetMap: Array<[ServiceTypeName, number]> = [
    ["Voice", calibration.voiceYoYPct],
    ["SMS", calibration.smsYoYPct],
  ];
  for (const [svc, targetPct] of targetMap) {
    const rev24 = records
      .filter((r) => r.year === 2024 && r.serviceType === svc)
      .reduce((acc, r) => acc + r.revenueIdrB, 0);
    const rev25 = records
      .filter((r) => r.year === 2025 && r.serviceType === svc)
      .reduce((acc, r) => acc + r.revenueIdrB, 0);
    const target25 = rev24 * Math.max(0.05, 1 + targetPct / 100);
    if (rev25 > 0) {
      const ratio = target25 / rev25;
      for (const r of records) {
        if (r.year === 2025 && r.serviceType === svc) {
          r.revenueIdrB = Number((r.revenueIdrB * ratio).toFixed(2));
        }
      }
    }
  }

  // Exact calibration for Mobile Subscribers average monthly base
  const subTargets: Array<[number, number]> = [
    [2024, BASELINE_SUBS_2024_M],
    [2025, calibration.subs2025M],
  ];
  for (const [yr, targetSubs] of subTargets) {
    const monthTotals = new Map<number, number>();
    for (const r of records) {
      if (r.year === yr) {
        monthTotals.set(r.month, (monthTotals.get(r.month) ?? 0) + r.mobileSubsM);
      }
    }
    const vals = Array.from(monthTotals.values());
    const avg = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
    if (avg > 0) {
      const ratio = targetSubs / avg;
      for (const r of records) {
        if (r.year === yr && r.mobileSubsM > 0) {
          r.mobileSubsM = Number((r.mobileSubsM * ratio).toFixed(4));
        }
      }
    }
  }

  return records;
}

export const INDIHOME_MIX_DATA: IndiHomeQuarterPoint[] = [
  { quarter: "Q1 2024", year: 2024, plan1PPct: 38.0, plan2PPct: 31.5, plan3PIptvPct: 30.5, blendedArpuK: 259.5, totalSubsM: 9.85 },
  { quarter: "Q2 2024", year: 2024, plan1PPct: 41.2, plan2PPct: 30.8, plan3PIptvPct: 28.0, blendedArpuK: 255.8, totalSubsM: 10.02 },
  { quarter: "Q3 2024", year: 2024, plan1PPct: 44.5, plan2PPct: 29.8, plan3PIptvPct: 25.7, blendedArpuK: 251.9, totalSubsM: 10.18 },
  { quarter: "Q4 2024", year: 2024, plan1PPct: 47.8, plan2PPct: 28.9, plan3PIptvPct: 23.3, blendedArpuK: 248.8, totalSubsM: 10.35 },
  { quarter: "Q1 2025", year: 2025, plan1PPct: 51.4, plan2PPct: 27.6, plan3PIptvPct: 21.0, blendedArpuK: 243.0, totalSubsM: 10.5 },
  { quarter: "Q2 2025", year: 2025, plan1PPct: 54.8, plan2PPct: 26.2, plan3PIptvPct: 19.0, blendedArpuK: 237.4, totalSubsM: 10.68 },
  { quarter: "Q3 2025", year: 2025, plan1PPct: 58.1, plan2PPct: 24.9, plan3PIptvPct: 17.0, blendedArpuK: 231.2, totalSubsM: 10.85 },
  { quarter: "Q4 2025", year: 2025, plan1PPct: 61.5, plan2PPct: 23.5, plan3PIptvPct: 15.0, blendedArpuK: 226.4, totalSubsM: 11.02 },
];

export const COMPETITION_DATA: CompetitionQuarterPoint[] = [
  { quarter: "Q1 2024", telkomselSharePct: 47.2, xlSmartSharePct: 25.6, iohSharePct: 27.2, telkomselYieldRpGb: 4250, competitorAvgYieldRpGb: 3150 },
  { quarter: "Q2 2024", telkomselSharePct: 46.8, xlSmartSharePct: 25.9, iohSharePct: 27.3, telkomselYieldRpGb: 4180, competitorAvgYieldRpGb: 3080 },
  { quarter: "Q3 2024", telkomselSharePct: 46.3, xlSmartSharePct: 26.2, iohSharePct: 27.5, telkomselYieldRpGb: 4090, competitorAvgYieldRpGb: 2990 },
  { quarter: "Q4 2024", telkomselSharePct: 45.9, xlSmartSharePct: 26.5, iohSharePct: 27.6, telkomselYieldRpGb: 3980, competitorAvgYieldRpGb: 2910 },
  { quarter: "Q1 2025", telkomselSharePct: 45.2, xlSmartSharePct: 27.1, iohSharePct: 27.7, telkomselYieldRpGb: 3860, competitorAvgYieldRpGb: 2820 },
  { quarter: "Q2 2025", telkomselSharePct: 44.7, xlSmartSharePct: 27.5, iohSharePct: 27.8, telkomselYieldRpGb: 3750, competitorAvgYieldRpGb: 2750 },
  { quarter: "Q3 2025", telkomselSharePct: 44.3, xlSmartSharePct: 27.9, iohSharePct: 27.8, telkomselYieldRpGb: 3660, competitorAvgYieldRpGb: 2690 },
  { quarter: "Q4 2025", telkomselSharePct: 44.0, xlSmartSharePct: 28.2, iohSharePct: 27.8, telkomselYieldRpGb: 3590, competitorAvgYieldRpGb: 2650 },
];

export const MACRO_DATA: MacroQuarterPoint[] = [
  { quarter: "Q1 2024", biRatePct: 6.0, purchasingPowerIndex: 103.5, esimAdoptionPct: 3.2, ottPenetrationPct: 78.0 },
  { quarter: "Q2 2024", biRatePct: 6.25, purchasingPowerIndex: 102.1, esimAdoptionPct: 4.1, ottPenetrationPct: 80.5 },
  { quarter: "Q3 2024", biRatePct: 6.0, purchasingPowerIndex: 100.8, esimAdoptionPct: 5.3, ottPenetrationPct: 82.8 },
  { quarter: "Q4 2024", biRatePct: 6.0, purchasingPowerIndex: 99.4, esimAdoptionPct: 6.8, ottPenetrationPct: 85.0 },
  { quarter: "Q1 2025", biRatePct: 6.0, purchasingPowerIndex: 98.2, esimAdoptionPct: 8.9, ottPenetrationPct: 87.2 },
  { quarter: "Q2 2025", biRatePct: 5.75, purchasingPowerIndex: 97.6, esimAdoptionPct: 11.4, ottPenetrationPct: 89.1 },
  { quarter: "Q3 2025", biRatePct: 5.75, purchasingPowerIndex: 97.1, esimAdoptionPct: 14.2, ottPenetrationPct: 90.8 },
  { quarter: "Q4 2025", biRatePct: 5.5, purchasingPowerIndex: 96.8, esimAdoptionPct: 17.5, ottPenetrationPct: 92.4 },
];

export const REGIONAL_CLUSTER_RISKS: RegionalClusterRisk[] = [
  { cluster: "Medan & North Sumatera", area: "Area 1 (Sumatera)", tier: "Urban Core", capexIdrT: 2.45, roiPct: 14.8, coverage5GPct: 22.5, costMultiplier3T: 1.35, subscribersM: 12.1 },
  { cluster: "Palembang & Sumbagsel", area: "Area 1 (Sumatera)", tier: "Semi-Urban", capexIdrT: 1.85, roiPct: 11.2, coverage5GPct: 14.2, costMultiplier3T: 1.65, subscribersM: 8.9 },
  { cluster: "Riau Islands & Natuna (3T)", area: "Area 1 (Sumatera)", tier: "3T / Frontier", capexIdrT: 1.4, roiPct: 4.1, coverage5GPct: 4.8, costMultiplier3T: 3.25, subscribersM: 3.2 },
  { cluster: "Aceh & West Coast", area: "Area 1 (Sumatera)", tier: "Semi-Urban", capexIdrT: 1.3, roiPct: 7.6, coverage5GPct: 8.5, costMultiplier3T: 2.15, subscribersM: 5.4 },
  { cluster: "Greater Jakarta (Jabotabek)", area: "Area 2 (Jabotabek & Jabar)", tier: "Urban Core", capexIdrT: 5.8, roiPct: 21.4, coverage5GPct: 48.2, costMultiplier3T: 1.0, subscribersM: 26.8 },
  { cluster: "Bandung & Priangan", area: "Area 2 (Jabotabek & Jabar)", tier: "Urban Core", capexIdrT: 2.9, roiPct: 17.2, coverage5GPct: 31.5, costMultiplier3T: 1.15, subscribersM: 11.4 },
  { cluster: "Banten & Industrial Corridor", area: "Area 2 (Jabotabek & Jabar)", tier: "Urban Core", capexIdrT: 2.1, roiPct: 16.5, coverage5GPct: 26.4, costMultiplier3T: 1.2, subscribersM: 7.6 },
  { cluster: "South Jabar Rural", area: "Area 2 (Jabotabek & Jabar)", tier: "Semi-Urban", capexIdrT: 1.15, roiPct: 9.8, coverage5GPct: 11.0, costMultiplier3T: 1.8, subscribersM: 4.5 },
  { cluster: "Surabaya & East Java Core", area: "Area 3 (Jawa, Bali & Nusra)", tier: "Urban Core", capexIdrT: 3.6, roiPct: 18.6, coverage5GPct: 35.0, costMultiplier3T: 1.1, subscribersM: 16.2 },
  { cluster: "Semarang & Yogyakarta", area: "Area 3 (Jawa, Bali & Nusra)", tier: "Urban Core", capexIdrT: 2.55, roiPct: 15.9, coverage5GPct: 25.8, costMultiplier3T: 1.2, subscribersM: 12.8 },
  { cluster: "Bali Tourism Corridor", area: "Area 3 (Jawa, Bali & Nusra)", tier: "Urban Core", capexIdrT: 1.95, roiPct: 19.1, coverage5GPct: 38.5, costMultiplier3T: 1.25, subscribersM: 5.9 },
  { cluster: "NTT & NTB Islands (3T)", area: "Area 3 (Jawa, Bali & Nusra)", tier: "3T / Frontier", capexIdrT: 1.75, roiPct: 3.8, coverage5GPct: 5.2, costMultiplier3T: 3.55, subscribersM: 4.8 },
  { cluster: "Makassar & South Sulawesi", area: "Area 4 (Pamasuka)", tier: "Urban Core", capexIdrT: 2.15, roiPct: 13.4, coverage5GPct: 19.6, costMultiplier3T: 1.55, subscribersM: 10.5 },
  { cluster: "Balikpapan & IKN Nusantara", area: "Area 4 (Pamasuka)", tier: "Strategic Growth", capexIdrT: 2.85, roiPct: 12.1, coverage5GPct: 28.4, costMultiplier3T: 1.9, subscribersM: 7.2 },
  { cluster: "Maluku Archipelago (3T)", area: "Area 4 (Pamasuka)", tier: "3T / Frontier", capexIdrT: 1.65, roiPct: 2.9, coverage5GPct: 3.4, costMultiplier3T: 3.9, subscribersM: 3.4 },
  { cluster: "Papua Highlands & Coast (3T)", area: "Area 4 (Pamasuka)", tier: "3T / Frontier", capexIdrT: 2.35, roiPct: 2.1, coverage5GPct: 2.8, costMultiplier3T: 4.35, subscribersM: 4.1 },
];

export const SUBSEA_CABLE_RISKS: SubseaCableRisk[] = [
  { corridor: "SMPCS — Papua & Maluku", area: "Area 4 (Pamasuka)", subseaRiskScore: 92, deployment3TCostIndex: 88, outages24M: 6, avgRepairDays: 42.5, primaryThreat: "Tectonic / Anchor Drag" },
  { corridor: "SKKL Sulawesi–Maluku Ring", area: "Area 4 (Pamasuka)", subseaRiskScore: 81, deployment3TCostIndex: 79, outages24M: 4, avgRepairDays: 28.0, primaryThreat: "Subsea Landslide" },
  { corridor: "SKKL Natuna–Batam Frontier", area: "Area 1 (Sumatera)", subseaRiskScore: 76, deployment3TCostIndex: 74, outages24M: 3, avgRepairDays: 21.5, primaryThreat: "Heavy Shipping Traffic" },
  { corridor: "Bali–Lombok–NTT Link", area: "Area 3 (Jawa, Bali & Nusra)", subseaRiskScore: 72, deployment3TCostIndex: 77, outages24M: 3, avgRepairDays: 19.0, primaryThreat: "Strong Currents / Reef" },
  { corridor: "JaSuKa (Java–Sum–Kal)", area: "Area 2 (Jabotabek & Jabar)", subseaRiskScore: 64, deployment3TCostIndex: 48, outages24M: 2, avgRepairDays: 16.5, primaryThreat: "Fishing Vessel Anchors" },
  { corridor: "IGG (Indonesia Global Gateway)", area: "Area 1 (Sumatera)", subseaRiskScore: 58, deployment3TCostIndex: 42, outages24M: 1, avgRepairDays: 14.0, primaryThreat: "Strait Congestion" },
  { corridor: "Java Terrestrial–Subsea Backup", area: "Area 3 (Jawa, Bali & Nusra)", subseaRiskScore: 41, deployment3TCostIndex: 35, outages24M: 1, avgRepairDays: 9.2, primaryThreat: "Civil Works / Excavation" },
];

export const SPECTRUM_GAP_DATA = [
  { band: "2.3 GHz (TDD)", allocatedMhz: 50, deficitMhz: 0 },
  { band: "2.1 GHz (DSS)", allocatedMhz: 15, deficitMhz: 5 },
  { band: "3.5 GHz (Mid-Band)", allocatedMhz: 0, deficitMhz: 100 },
  { band: "700 MHz (Low-Band 3T)", allocatedMhz: 0, deficitMhz: 30 },
];

export function filterRecords(
  records: OperationalRecord[],
  filters: Pick<FilterState, "areas" | "segments" | "services">
): OperationalRecord[] {
  const areaSet = new Set(filters.areas);
  const segSet = new Set(filters.segments);
  const svcSet = new Set(filters.services);
  return records.filter(
    (r) => areaSet.has(r.area) && segSet.has(r.segment) && svcSet.has(r.serviceType)
  );
}

export function computeKpiSnapshot(
  filtered: OperationalRecord[],
  areaSegOnly: OperationalRecord[]
): KpiSnapshot {
  const sumRevT = (rows: OperationalRecord[], yr: number) =>
    rows.filter((r) => r.year === yr).reduce((acc, r) => acc + r.revenueIdrB, 0) / 1000;

  const avgMonthlySubs = (rows: OperationalRecord[], yr: number) => {
    const byMonth = new Map<number, number>();
    for (const r of rows) {
      if (r.year === yr) {
        byMonth.set(r.month, (byMonth.get(r.month) ?? 0) + r.mobileSubsM);
      }
    }
    const vals = Array.from(byMonth.values());
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };

  const avgArpu = (yr: number) => {
    let candidates = filtered.filter((r) => r.year === yr && r.arpuIdrK !== null);
    if (candidates.length === 0) {
      candidates = areaSegOnly.filter(
        (r) => r.year === yr && r.serviceType === "Mobile Data" && r.arpuIdrK !== null
      );
    }
    if (candidates.length === 0) return 0;
    return candidates.reduce((acc, r) => acc + (r.arpuIdrK ?? 0), 0) / candidates.length;
  };

  const meanField = (yr: number, field: "coverage5GPct" | "churnRatePct") => {
    const sub = areaSegOnly.filter((r) => r.year === yr);
    if (!sub.length) return 0;
    return sub.reduce((acc, r) => acc + r[field], 0) / sub.length;
  };

  const svcYoY = (svc: ServiceTypeName) => {
    const r24 = areaSegOnly
      .filter((r) => r.year === 2024 && r.serviceType === svc)
      .reduce((acc, r) => acc + r.revenueIdrB, 0);
    const r25 = areaSegOnly
      .filter((r) => r.year === 2025 && r.serviceType === svc)
      .reduce((acc, r) => acc + r.revenueIdrB, 0);
    return r24 > 0 ? ((r25 - r24) / r24) * 100 : 0;
  };

  const pct = (curr: number, prev: number) => (prev !== 0 ? ((curr - prev) / prev) * 100 : 0);

  const rev24 = sumRevT(filtered, 2024);
  const rev25 = sumRevT(filtered, 2025);
  const subs24 = avgMonthlySubs(areaSegOnly, 2024);
  const subs25 = avgMonthlySubs(areaSegOnly, 2025);
  const arpu24 = avgArpu(2024);
  const arpu25 = avgArpu(2025);
  const cov24 = meanField(2024, "coverage5GPct");
  const cov25 = meanField(2025, "coverage5GPct");
  const churn24 = meanField(2024, "churnRatePct");
  const churn25 = meanField(2025, "churnRatePct");

  return {
    revenue2025T: rev25,
    revenue2024T: rev24,
    revenueYoYPct: pct(rev25, rev24),
    mobileSubs2025M: subs25,
    mobileSubs2024M: subs24,
    mobileSubsDeltaM: subs25 - subs24,
    mobileSubsYoYPct: pct(subs25, subs24),
    arpu2025K: arpu25,
    arpuYoYPct: pct(arpu25, arpu24),
    coverage5G2025Pct: cov25,
    coverage5GDeltaPp: cov25 - cov24,
    churn2025Pct: churn25,
    churnDeltaPp: churn25 - churn24,
    voiceYoYPct: svcYoY("Voice"),
    smsYoYPct: svcYoY("SMS"),
  };
}

export function buildCsvTemplate(records: OperationalRecord[]): string {
  const header = [
    "Date",
    "Year",
    "Month",
    "Area",
    "Segment",
    "Service_Type",
    "Revenue_IDR_B",
    "Mobile_Subs_M",
    "IndiHome_Subs_M",
    "ARPU_IDR_K",
    "Coverage_5G_Pct",
    "Churn_Rate_Pct",
  ].join(",");

  const rows = records.map((r) =>
    [
      r.date,
      r.year,
      r.month,
      `"${r.area}"`,
      r.segment,
      `"${r.serviceType}"`,
      r.revenueIdrB,
      r.mobileSubsM,
      r.indihomeSubsM,
      r.arpuIdrK ?? "",
      r.coverage5GPct,
      r.churnRatePct,
    ].join(",")
  );
  return [header, ...rows].join("\n");
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

const REQUIRED_CSV_HEADERS = [
  "Date",
  "Year",
  "Month",
  "Area",
  "Segment",
  "Service_Type",
  "Revenue_IDR_B",
  "Mobile_Subs_M",
  "ARPU_IDR_K",
  "Coverage_5G_Pct",
  "Churn_Rate_Pct",
];

export function parseOperationalCsv(
  csvText: string
): { records: OperationalRecord[] | null; error: string | null } {
  const lines = csvText
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { records: null, error: "CSV file must contain a header row and at least one data row." };
  }

  const headers = splitCsvLine(lines[0]);
  const missing = REQUIRED_CSV_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    return {
      records: null,
      error: `Missing required columns: ${missing.join(", ")}. Download the CSV template to verify schema.`,
    };
  }

  const idx = (name: string) => headers.indexOf(name);
  const areaSet = new Set<string>(AREAS);
  const segSet = new Set<string>(SEGMENTS);
  const svcSet = new Set<string>(SERVICE_TYPES);
  const records: OperationalRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (cols.length < REQUIRED_CSV_HEADERS.length) continue;

    const area = cols[idx("Area")] as AreaName;
    const segment = cols[idx("Segment")] as SegmentName;
    const serviceType = cols[idx("Service_Type")] as ServiceTypeName;
    if (!areaSet.has(area) || !segSet.has(segment) || !svcSet.has(serviceType)) continue;

    const year = Number(cols[idx("Year")]);
    const month = Number(cols[idx("Month")]);
    if (!Number.isFinite(year) || !Number.isFinite(month)) continue;

    const arpuRaw = cols[idx("ARPU_IDR_K")];
    const indihomeIdx = idx("IndiHome_Subs_M");

    records.push({
      date: cols[idx("Date")],
      year,
      month,
      quarter: `Q${Math.floor((month - 1) / 3) + 1} ${year}`,
      area,
      segment,
      serviceType,
      revenueIdrB: Number(cols[idx("Revenue_IDR_B")]) || 0,
      mobileSubsM: Number(cols[idx("Mobile_Subs_M")]) || 0,
      indihomeSubsM: indihomeIdx >= 0 ? Number(cols[indihomeIdx]) || 0 : 0,
      arpuIdrK: arpuRaw !== "" && Number.isFinite(Number(arpuRaw)) ? Number(arpuRaw) : null,
      coverage5GPct: Number(cols[idx("Coverage_5G_Pct")]) || 0,
      churnRatePct: Number(cols[idx("Churn_Rate_Pct")]) || 0,
    });
  }

  if (records.length === 0) {
    return {
      records: null,
      error: "No valid rows matched Telkom Area 1–4, Segment (B2C/B2B), and Service_Type taxonomy.",
    };
  }

  return { records, error: null };
}
