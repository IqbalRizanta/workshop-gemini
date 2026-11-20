import { useMemo, useState } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RotateCcw } from "lucide-react";
import { TELKOM_COLORS } from "../config/telkom2025";
import { INDIHOME_MIX_DATA } from "../services/dataEngine";
import { runRetentionArpuSimulation } from "../services/simulationEngine";
import type { KpiSnapshot } from "../types/telemetry";

interface RetentionSimulatorTabProps {
  kpis: KpiSnapshot;
}

const DEFAULT_LEVERS = {
  discountRatePct: 6.0,
  crossSellRatePct: 14.0,
  priceAdjPct: 3.0,
  esimLoyaltyLevel: 6,
};

export function RetentionSimulatorTab({ kpis }: RetentionSimulatorTabProps) {
  const [discountRatePct, setDiscountRatePct] = useState(DEFAULT_LEVERS.discountRatePct);
  const [crossSellRatePct, setCrossSellRatePct] = useState(DEFAULT_LEVERS.crossSellRatePct);
  const [priceAdjPct, setPriceAdjPct] = useState(DEFAULT_LEVERS.priceAdjPct);
  const [esimLoyaltyLevel, setEsimLoyaltyLevel] = useState(DEFAULT_LEVERS.esimLoyaltyLevel);

  const sim = useMemo(
    () =>
      runRetentionArpuSimulation({
        baseSubsM: kpis.mobileSubs2025M,
        discountRatePct,
        crossSellRatePct,
        priceAdjPct,
        esimLoyaltyLevel,
      }),
    [kpis.mobileSubs2025M, discountRatePct, crossSellRatePct, priceAdjPct, esimLoyaltyLevel]
  );

  const resetLevers = () => {
    setDiscountRatePct(DEFAULT_LEVERS.discountRatePct);
    setCrossSellRatePct(DEFAULT_LEVERS.crossSellRatePct);
    setPriceAdjPct(DEFAULT_LEVERS.priceAdjPct);
    setEsimLoyaltyLevel(DEFAULT_LEVERS.esimLoyaltyLevel);
  };

  return (
    <div className="space-y-6">
      {/* Main Simulator Split: Controls + Real-time Projection Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left: Commercial Levers & Impact Summary */}
        <section className="xl:col-span-4 bg-white border border-slate-200 rounded-lg p-5 space-y-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Commercial Strategy Levers
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                12-month elasticity projection vs. do-nothing baseline
              </p>
            </div>
            <button
              type="button"
              onClick={resetLevers}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-[#E00000] transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-700">Targeted Retention Discount</span>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {discountRatePct.toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={20}
                step={0.5}
                value={discountRatePct}
                onChange={(e) => setDiscountRatePct(Number(e.target.value))}
                className="w-full telkom-slider"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                High-churn cohort loyalty offer; lowers churn with mild ARPU dilution.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-700">IndiHome 1P → 3P / FMC Cross-Sell</span>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {crossSellRatePct.toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={35}
                step={1}
                value={crossSellRatePct}
                onChange={(e) => setCrossSellRatePct(Number(e.target.value))}
                className="w-full telkom-slider"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Converts internet-only households to Telkomsel One &amp; IPTV bundles.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-700">Mobile Data Tariff Adjustment</span>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {priceAdjPct >= 0 ? "+" : ""}
                  {priceAdjPct.toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min={-10}
                max={12}
                step={0.5}
                value={priceAdjPct}
                onChange={(e) => setPriceAdjPct(Number(e.target.value))}
                className="w-full telkom-slider"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Positive repricing lifts ARPU but introduces price-elastic churn drag.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-700">MyTelkomsel e-SIM Lock-In Intensity</span>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {esimLoyaltyLevel} / 10
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={esimLoyaltyLevel}
                onChange={(e) => setEsimLoyaltyLevel(Number(e.target.value))}
                className="w-full telkom-slider"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Telkomsel Poin perks, seamless e-SIM migration, and digital ecosystem stickiness.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-900 mb-3">
              Simulated 12-Month Outcome
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-md border border-slate-100">
                <div className="text-[11px] text-slate-500">Projected Subs (M12)</div>
                <div className="font-mono tabular-nums text-lg font-semibold text-slate-900 mt-0.5">
                  {sim.projectedSubsM12.toFixed(2)}M
                </div>
                <div
                  className={`font-mono tabular-nums text-[11px] font-medium mt-0.5 ${
                    sim.subsVsBaselineM12 >= 0 ? "text-emerald-700" : "text-[#C50000]"
                  }`}
                >
                  {sim.subsVsBaselineM12 >= 0 ? "+" : ""}
                  {sim.subsVsBaselineM12.toFixed(2)}M vs base
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-md border border-slate-100">
                <div className="text-[11px] text-slate-500">Net Revenue Uplift</div>
                <div
                  className={`font-mono tabular-nums text-lg font-semibold mt-0.5 ${
                    sim.netRevenueUpliftT >= 0 ? "text-emerald-700" : "text-[#C50000]"
                  }`}
                >
                  {sim.netRevenueUpliftT >= 0 ? "+" : ""}Rp {sim.netRevenueUpliftT.toFixed(2)}T
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Annualized vs base</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-md border border-slate-100">
                <div className="text-[11px] text-slate-500">Mobile ARPU (M12)</div>
                <div className="font-mono tabular-nums text-base font-semibold text-slate-900 mt-0.5">
                  Rp {sim.mobileArpuM12K.toFixed(1)}k
                </div>
                <div
                  className={`font-mono tabular-nums text-[11px] font-medium mt-0.5 ${
                    sim.mobileArpuChangePct >= 0 ? "text-emerald-700" : "text-[#C50000]"
                  }`}
                >
                  {sim.mobileArpuChangePct >= 0 ? "+" : ""}
                  {sim.mobileArpuChangePct.toFixed(1)}% vs start
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-md border border-slate-100">
                <div className="text-[11px] text-slate-500">IndiHome ARPU (M12)</div>
                <div className="font-mono tabular-nums text-base font-semibold text-slate-900 mt-0.5">
                  Rp {sim.indihomeArpuM12K.toFixed(1)}k
                </div>
                <div
                  className={`font-mono tabular-nums text-[11px] font-medium mt-0.5 ${
                    sim.indihomeArpuChangePct >= 0 ? "text-emerald-700" : "text-[#C50000]"
                  }`}
                >
                  {sim.indihomeArpuChangePct >= 0 ? "+" : ""}
                  {sim.indihomeArpuChangePct.toFixed(1)}% vs start
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Dual Trajectory Charts */}
        <div className="xl:col-span-8 space-y-5">
          <section className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Simulated Mobile Subscriber Recovery (Millions)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Recovery trajectory from FY2025 base toward the FY2024 benchmark ({sim.target2024SubsM.toFixed(1)}M)
                </p>
              </div>
            </div>
            <div className="h-[230px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={sim.series} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={{ stroke: "#CBD5E1" }} tickLine={false} />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    axisLine={false}
                    tickLine={false}
                    unit="M"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E2E8F0",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
                  <ReferenceLine
                    y={sim.target2024SubsM}
                    stroke={TELKOM_COLORS.emerald}
                    strokeDasharray="4 4"
                    label={{
                      value: `FY2024 Target (${sim.target2024SubsM.toFixed(1)}M)`,
                      position: "insideTopRight",
                      fill: TELKOM_COLORS.emerald,
                      fontSize: 11,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="simulatedSubsM"
                    name="Simulated Subs (With Strategy)"
                    stroke={TELKOM_COLORS.red}
                    fill={TELKOM_COLORS.red}
                    fillOpacity={0.09}
                    strokeWidth={2.6}
                  />
                  <Line
                    type="monotone"
                    dataKey="baselineSubsM"
                    name="Baseline Subs (Do-Nothing)"
                    stroke={TELKOM_COLORS.coolGray}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Simulated IndiHome &amp; Mobile ARPU Recovery (IDR Thousands)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Blended monthly revenue per user across Fixed Broadband (left axis) and Mobile (right axis)
              </p>
            </div>
            <div className="h-[230px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sim.series} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={{ stroke: "#CBD5E1" }} tickLine={false} />
                  <YAxis
                    yAxisId="ih"
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    axisLine={false}
                    tickLine={false}
                    unit="k"
                  />
                  <YAxis
                    yAxisId="mob"
                    orientation="right"
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    axisLine={false}
                    tickLine={false}
                    unit="k"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E2E8F0",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
                  <Line
                    yAxisId="ih"
                    type="monotone"
                    dataKey="simulatedIndiHomeArpuK"
                    name="Simulated IndiHome ARPU (Rp k)"
                    stroke={TELKOM_COLORS.blue}
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    yAxisId="ih"
                    type="monotone"
                    dataKey="baselineIndiHomeArpuK"
                    name="Baseline IndiHome ARPU (Rp k)"
                    stroke={TELKOM_COLORS.blue}
                    strokeWidth={1.8}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                  <Line
                    yAxisId="mob"
                    type="monotone"
                    dataKey="simulatedMobArpuK"
                    name="Simulated Mobile ARPU (Rp k)"
                    stroke={TELKOM_COLORS.slate}
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      </div>

      {/* Bottom: Historical IndiHome 3P -> 1P Erosion Breakdown */}
      <section className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-900">
            IndiHome Structural Package Mix Shift (3P/IPTV → 1P Internet-Only) &amp; ARPU Erosion
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Quarterly package mix share (%) vs. Blended IndiHome ARPU (Rp k) from Q1 2024 through Q4 2025
          </p>
        </div>
        <div className="h-[310px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={INDIHOME_MIX_DATA} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={{ stroke: "#CBD5E1" }} tickLine={false} />
              <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} unit="%" />
              <YAxis yAxisId="right" orientation="right" domain={[210, 275]} tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} unit="k" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#E2E8F0",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              <Bar yAxisId="left" dataKey="plan1PPct" name="1P Internet-Only (%)" stackId="ih" fill={TELKOM_COLORS.red} />
              <Bar yAxisId="left" dataKey="plan2PPct" name="2P Bundle (%)" stackId="ih" fill={TELKOM_COLORS.slateLight} />
              <Bar yAxisId="left" dataKey="plan3PIptvPct" name="3P / IPTV Premium (%)" stackId="ih" fill={TELKOM_COLORS.slate} radius={[3, 3, 0, 0]} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="blendedArpuK"
                name="Blended IndiHome ARPU (Rp k)"
                stroke={TELKOM_COLORS.amber}
                strokeWidth={2.8}
                dot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
