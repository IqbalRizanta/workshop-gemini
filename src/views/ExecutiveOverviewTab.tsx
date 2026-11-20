import { useState } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { KpiCard } from "../components/KpiCard";
import { PROBLEM_AREAS, TELKOM_COLORS } from "../config/telkom2025";
import { COMPETITION_DATA, MACRO_DATA } from "../services/dataEngine";
import type { KpiSnapshot, TimeRangeOption } from "../types/telemetry";

interface ExecutiveOverviewTabProps {
  kpis: KpiSnapshot;
  timeRange: TimeRangeOption;
  onSelectProblemForAi: (problemId: string) => void;
}

export function ExecutiveOverviewTab({
  kpis,
  timeRange,
  onSelectProblemForAi,
}: ExecutiveOverviewTabProps) {
  const [matrixExpanded, setMatrixExpanded] = useState(true);

  const displayRevT = timeRange === "2024 Only" ? kpis.revenue2024T : kpis.revenue2025T;
  const revDeltaText =
    timeRange === "2024 Only"
      ? "FY2024 Baseline"
      : `${kpis.revenueYoYPct >= 0 ? "+" : ""}${kpis.revenueYoYPct.toFixed(2)}% YoY`;

  return (
    <div className="space-y-6">
      {/* Row 1: 5 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <KpiCard
          label="Total Revenue (Filtered)"
          value={`Rp ${displayRevT.toFixed(1)}T`}
          deltaText={revDeltaText}
          trend={
            timeRange === "2024 Only"
              ? "neutral"
              : kpis.revenueYoYPct >= 0
                ? "positive"
                : "negative"
          }
          subtext={timeRange === "2024 Only" ? "FY2024" : "FY2025"}
        />
        <KpiCard
          label="Mobile Subscribers"
          value={`${kpis.mobileSubs2025M.toFixed(1)}M`}
          deltaText={`${kpis.mobileSubsDeltaM >= 0 ? "+" : ""}${kpis.mobileSubsDeltaM.toFixed(1)}M (${kpis.mobileSubsYoYPct >= 0 ? "+" : ""}${kpis.mobileSubsYoYPct.toFixed(1)}%)`}
          trend={kpis.mobileSubsDeltaM >= 0 ? "positive" : "negative"}
          subtext={`vs ${kpis.mobileSubs2024M.toFixed(1)}M`}
        />
        <KpiCard
          label="Blended Avg. ARPU"
          value={`Rp ${kpis.arpu2025K.toFixed(1)}k`}
          deltaText={`${kpis.arpuYoYPct >= 0 ? "+" : ""}${kpis.arpuYoYPct.toFixed(2)}% YoY`}
          trend={kpis.arpuYoYPct >= 0 ? "positive" : "negative"}
          subtext="Monthly"
        />
        <KpiCard
          label="5G Pop. Coverage"
          value={`${kpis.coverage5G2025Pct.toFixed(1)}%`}
          deltaText={`${kpis.coverage5GDeltaPp >= 0 ? "+" : ""}${kpis.coverage5GDeltaPp.toFixed(1)} pp YoY`}
          trend={kpis.coverage5GDeltaPp >= 0 ? "positive" : "negative"}
          subtext="No 3.5 GHz"
        />
        <KpiCard
          label="Monthly Churn Rate"
          value={`${kpis.churn2025Pct.toFixed(2)}%`}
          deltaText={`${kpis.churnDeltaPp >= 0 ? "+" : ""}${kpis.churnDeltaPp.toFixed(2)} pp YoY`}
          trend={kpis.churnDeltaPp <= 0 ? "positive" : "negative"}
          subtext="Lower is better"
        />
      </div>

      {/* Row 2: Executive Risk Briefing */}
      <section className="bg-[#FFF8F8] border border-red-200/90 rounded-lg p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#E00000] shrink-0 mt-0.5" />
          <div className="space-y-2.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900">
                Executive Risk Briefing — FY2025 Annual Report Priority Watchlist
              </h2>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs font-medium text-[#A60000]">
                7 Active Operational &amp; Financial Challenges
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-700 leading-relaxed">
              <div>
                <span className="font-semibold text-slate-900">Legacy Contraction &amp; Churn: </span>
                Voice (<span className="font-mono tabular-nums font-medium text-[#A60000]">{kpis.voiceYoYPct.toFixed(1)}%</span>) and SMS (
                <span className="font-mono tabular-nums font-medium text-[#A60000]">{kpis.smsYoYPct.toFixed(1)}%</span>) fell sharply under 92.4% OTT penetration, while filtered mobile subscribers stand at{" "}
                <span className="font-mono tabular-nums font-semibold text-slate-900">{kpis.mobileSubs2025M.toFixed(1)}M</span> amid XLSmart and IOH price competition.
              </div>
              <div>
                <span className="font-semibold text-slate-900">ARPU &amp; Macro Squeeze: </span>
                IndiHome households migrated rapidly from 3P/IPTV bundles to 1P internet-only plans (38.0% → 61.5% mix), compounding elevated BI interest rates (5.5%–6.25%) and softer consumer purchasing power.
              </div>
              <div>
                <span className="font-semibold text-slate-900">CAPEX &amp; Subsea Resilience: </span>
                Absence of 3.5 GHz mid-band spectrum caps 5G monetization while 3T expansion unit costs (up to 4.35x urban baseline) and SMPCS/Papua cable outages elevate network risk.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Row 3: Competitive Market Consolidation & Macro Pressure Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Competition Chart */}
        <section className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Market Consolidation &amp; Data Yield Compression
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Revenue market share (%) across Telkomsel, XLSmart merger, and IOH vs. Telkomsel data yield (Rp/GB)
            </p>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={COMPETITION_DATA} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={{ stroke: "#CBD5E1" }} tickLine={false} />
                <YAxis
                  yAxisId="left"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[2800, 4600]}
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#E2E8F0",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Bar yAxisId="left" dataKey="telkomselSharePct" name="Telkomsel Share (%)" stackId="rms" fill={TELKOM_COLORS.red} />
                <Bar yAxisId="left" dataKey="xlSmartSharePct" name="XLSmart (%)" stackId="rms" fill={TELKOM_COLORS.slate} />
                <Bar yAxisId="left" dataKey="iohSharePct" name="IOH (%)" stackId="rms" fill={TELKOM_COLORS.amber} radius={[3, 3, 0, 0]} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="telkomselYieldRpGb"
                  name="Telkomsel Yield (Rp/GB)"
                  stroke={TELKOM_COLORS.darkCrimson}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Macro & e-SIM Chart */}
        <section className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Macroeconomic Pressures &amp; e-SIM Disruption
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Consumer Purchasing Power Index (Base = 100) vs. BI Interest Rate (%) and e-SIM adoption (%)
            </p>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={MACRO_DATA} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={{ stroke: "#CBD5E1" }} tickLine={false} />
                <YAxis
                  yAxisId="left"
                  domain={[94, 106]}
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 22]}
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#E2E8F0",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="purchasingPowerIndex"
                  name="Purchasing Power Index"
                  fill="#2C3E50"
                  fillOpacity={0.09}
                  stroke={TELKOM_COLORS.slate}
                  strokeWidth={2.5}
                />
                <Bar
                  yAxisId="right"
                  dataKey="esimAdoptionPct"
                  name="e-SIM Adoption (%)"
                  fill={TELKOM_COLORS.amber}
                  fillOpacity={0.55}
                  radius={[3, 3, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="biRatePct"
                  name="BI Rate (%)"
                  stroke={TELKOM_COLORS.red}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Row 4: Full 7-Challenge Executive Risk Matrix */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setMatrixExpanded((v) => !v)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors"
        >
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              FY2025 Seven-Challenge Strategic Risk Matrix
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any challenge to open the AI Strategic Solution Generator pre-loaded with live filtered KPIs
            </p>
          </div>
          {matrixExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          )}
        </button>

        {matrixExpanded && (
          <div className="border-t border-slate-200 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                  <th className="py-2.5 px-5 whitespace-nowrap">Challenge Area</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">Severity</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">2025 Benchmark</th>
                  <th className="py-2.5 px-4">Operational Diagnosis</th>
                  <th className="py-2.5 px-5 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {PROBLEM_AREAS.map((item) => {
                  const sevClass =
                    item.severity === "Critical"
                      ? "text-[#C50000] font-semibold"
                      : item.severity === "High"
                        ? "text-amber-700 font-semibold"
                        : "text-slate-700 font-medium";
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-5 font-medium text-slate-900 whitespace-nowrap">
                        <span className="font-mono tabular-nums text-slate-400 mr-2">{item.index}.</span>
                        {item.title}
                      </td>
                      <td className={`py-3 px-4 whitespace-nowrap ${sevClass}`}>
                        {item.severity}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-700 whitespace-nowrap">
                        {item.headlineMetric}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-md leading-relaxed">
                        {item.summary}
                      </td>
                      <td className="py-3 px-5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onSelectProblemForAi(item.id)}
                          className="text-xs font-medium text-[#E00000] hover:text-[#A60000] hover:underline whitespace-nowrap"
                        >
                          Generate Plan
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
