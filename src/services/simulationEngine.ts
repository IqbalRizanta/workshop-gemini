import type {
  OttProjectionPoint,
  RetentionSimPoint,
  RetentionSimResult,
} from "../types/telemetry";

export function runOttCannibalizationModel(
  legacy2025T: number,
  modern2025T: number,
  ottSpeedPct: number,
  dataOffsetCagrPct: number,
  voiceToDataCapturePct: number
): OttProjectionPoint[] {
  const years = [2025, 2026, 2027, 2028];
  const points: OttProjectionPoint[] = [];
  let curLegacy = legacy2025T;
  let curModern = modern2025T;

  for (let i = 0; i < years.length; i++) {
    if (i > 0) {
      const lostLegacy = curLegacy * (ottSpeedPct / 100);
      curLegacy -= lostLegacy;
      const recaptured = lostLegacy * (voiceToDataCapturePct / 100);
      curModern = curModern * (1 + dataOffsetCagrPct / 100) + recaptured;
    }
    const total = curLegacy + curModern;
    points.push({
      year: String(years[i]),
      legacyIdrT: Number(curLegacy.toFixed(2)),
      dataDigitalIdrT: Number(curModern.toFixed(2)),
      legacySharePct: total > 0 ? Number(((curLegacy / total) * 100).toFixed(1)) : 0,
    });
  }
  return points;
}

export interface RetentionSimInputs {
  baseSubsM: number;
  discountRatePct: number;
  crossSellRatePct: number;
  priceAdjPct: number;
  esimLoyaltyLevel: number; // 1-10
  baseMobArpuK?: number;
  baseIndiHomeArpuK?: number;
  baseIndiHomeSubsM?: number;
}

export function runRetentionArpuSimulation(inputs: RetentionSimInputs): RetentionSimResult {
  const {
    baseSubsM,
    discountRatePct,
    crossSellRatePct,
    priceAdjPct,
    esimLoyaltyLevel,
    baseMobArpuK = 44.6,
    baseIndiHomeArpuK = 233.5,
    baseIndiHomeSubsM = 10.82,
  } = inputs;

  const scaleRatio = baseSubsM > 0 ? baseSubsM / 156.1 : 1.0;

  const subRecovery12m =
    (discountRatePct * 0.24 +
      crossSellRatePct * 0.11 +
      esimLoyaltyLevel * 0.28 -
      Math.max(0, priceAdjPct) * 0.3 +
      Math.abs(Math.min(0, priceAdjPct)) * 0.18) *
    scaleRatio;

  const rawCurve = Array.from({ length: 13 }, (_, m) => 1 - Math.exp(-m / 5));
  const curveEnd = rawCurve[12] || 1;
  const adoptionCurve = rawCurve.map((v) => v / curveEnd);

  const mobArpuDeltaPct =
    priceAdjPct * 0.88 -
    discountRatePct * 0.32 +
    crossSellRatePct * 0.14 +
    esimLoyaltyLevel * 0.22;

  const ihArpuUpliftK = (crossSellRatePct / 100) * 85.0 - discountRatePct * 0.45;

  const series: RetentionSimPoint[] = [];
  for (let m = 0; m <= 12; m++) {
    const frac = m / 12;
    const adopt = adoptionCurve[m];

    const baselineSubs = baseSubsM - frac * (2.4 * scaleRatio);
    const simulatedSubs = baselineSubs + adopt * (subRecovery12m + 2.4 * scaleRatio);

    const baselineMobArpu = baseMobArpuK * (1 - 0.032 * frac);
    const simulatedMobArpu = baseMobArpuK * (1 + (mobArpuDeltaPct / 100) * adopt);

    const baselineIhArpu = baseIndiHomeArpuK * (1 - 0.055 * frac);
    const simulatedIhArpu = baseIndiHomeArpuK + ihArpuUpliftK * adopt;

    series.push({
      monthLabel: `M${m}`,
      baselineSubsM: Number(baselineSubs.toFixed(2)),
      simulatedSubsM: Number(simulatedSubs.toFixed(2)),
      baselineMobArpuK: Number(baselineMobArpu.toFixed(1)),
      simulatedMobArpuK: Number(simulatedMobArpu.toFixed(1)),
      baselineIndiHomeArpuK: Number(baselineIhArpu.toFixed(1)),
      simulatedIndiHomeArpuK: Number(simulatedIhArpu.toFixed(1)),
    });
  }

  const last = series[12];
  const mobRevBase = (last.baselineSubsM * last.baselineMobArpuK * 12) / 1000;
  const mobRevSim = (last.simulatedSubsM * last.simulatedMobArpuK * 12) / 1000;
  const ihRevBase = (baseIndiHomeSubsM * scaleRatio * last.baselineIndiHomeArpuK * 12) / 1000;
  const ihRevSim = (baseIndiHomeSubsM * scaleRatio * last.simulatedIndiHomeArpuK * 12) / 1000;

  return {
    series,
    target2024SubsM: Number((159.4 * scaleRatio).toFixed(2)),
    projectedSubsM12: last.simulatedSubsM,
    subsVsBaselineM12: Number((last.simulatedSubsM - last.baselineSubsM).toFixed(2)),
    netRevenueUpliftT: Number((mobRevSim + ihRevSim - (mobRevBase + ihRevBase)).toFixed(2)),
    mobileArpuM12K: last.simulatedMobArpuK,
    mobileArpuChangePct: Number((((last.simulatedMobArpuK / baseMobArpuK) - 1) * 100).toFixed(1)),
    indihomeArpuM12K: last.simulatedIndiHomeArpuK,
    indihomeArpuChangePct: Number(
      (((last.simulatedIndiHomeArpuK / baseIndiHomeArpuK) - 1) * 100).toFixed(1)
    ),
  };
}
