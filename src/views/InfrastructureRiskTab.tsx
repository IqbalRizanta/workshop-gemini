import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { KpiCard } from "../components/KpiCard";
import { TELKOM_COLORS } from "../config/telkom2025";
import {
  REGIONAL_CLUSTER_RISKS,
  SPECTRUM_GAP_DATA,
  SUBSEA_CABLE_RISKS,
} from "../services/dataEngine";
import type { AreaName, RegionalClusterRisk, SubseaCableRisk } from "../types/telemetry";

interface InfrastructureRiskTabProps {
  selectedAreas: AreaName[];
}

const TIER_COLORS: Record<RegionalClusterRisk["tier"], string> = {
  "Urban Core": TELKOM_COLORS.slate,
  "Strategic Growth": TELKOM_COLORS.blue,
  "Semi-Urban": TELKOM_COLORS.amber,
  "3T / Frontier": TELKOM_COLORS.red,
};

export function InfrastructureRiskTab({ selectedAreas }: InfrastructureRiskTabProps) {
  const areaSet = useMemo(() => new Set(selectedAreas), [selectedAreas]);

  const clusters = useMemo(
    () => REGIONAL_CLUSTER_RISKS.filter((c) => areaSet.has(c.area)),
    [areaSet]
  );

  const cables = useMemo(
    () =>
      SUBSEA_CABLE_RISKS.filter((c) => areaSet.has(c.area)).sort(
        (a, b) => b.subseaRiskScore - a.subseaRiskScore
      ),
    [areaSet]
  );

  const summary = useMemo(() => {
    const totalCapex = clusters.reduce((acc, c) => acc + c.capexIdrT, 0);
    const weightedRoi =
      totalCapex > 0
        ? clusters.reduce((acc, c) => acc + c.roiPct * c.capexIdrT, 0) / totalCapex
        : 0;
    const peak3T = clusters.reduce((acc, c) => Math.max(acc, c.costMultiplier3T), 0);
    const totalOutages = cables.reduce((acc, c) => acc + c.outages24M, 0);
    const avgMttr =
      cables.length > 0
        ? cables.reduce((acc, c) => acc + c.avgRepairDays, 0) / cables.length
        : 0;
    return { totalCapex, weightedRoi, peak3T, totalOutages, avgMttr };
  }, [clusters, cables]);

  return (
    <div className="space-y-6">
      {/* Row 1: Infrastructure KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Filtered Regional CAPEX"
          value={`Rp ${summary.totalCapex.toFixed(1)}T`}
          deltaText={`${clusters.length} network clusters`}
          trend="neutral"
          subtext="FY2025 Allocation"
        />
        <KpiCard
          label="Weighted Avg. CAPEX ROI"
          value={`${summary.weightedRoi.toFixed(1)}%`}
          deltaText={summary.weightedRoi >= 10.5 ? "Above 10.5% WACC" : "Below 10.5% WACC"}
          trend={summary.weightedRoi >= 10.5 ? "positive" : "negative"}
          subtext="Dragged by 3T & 5G"
        />
        <KpiCard
          label="Peak 3T Unit Cost Premium"
          value={`${summary.peak3T.toFixed(2)}x`}
          deltaText="vs Urban baseline (1.0x)"
          trend={summary.peak3T > 2.5 ? "negative" : "neutral"}
          subtext="Backhaul & power"
        />
        <KpiCard
          label="Subsea Cable Outages (24M)"
          value={`${summary.totalOutages} Events`}
          deltaText={`Avg MTTR ${summary.avgMttr.toFixed(1)} days`}
          trend={summary.totalOutages > 5 ? "negative" : "neutral"}
          subtext="Physical cuts"
        />
      </div>

      {/* Row 2: Regional CAPEX vs ROI & Subsea Vulnerability Matrix */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* CAPEX vs ROI Scatter */}
        <section className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Regional CAPEX Distribution vs. Network ROI
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Bubble size = subscriber base (M) · Dashed line = 10.5% WACC hurdle rate
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
              {(Object.keys(TIER_COLORS) as RegionalClusterRisk["tier"][]).map((tier) => (
                <span key={tier} className="inline-flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: TIER_COLORS[tier] }}
                  />
                  <span>{tier}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 14, right: 16, left: -8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis
                  type="number"
                  dataKey="capexIdrT"
                  name="CAPEX"
                  unit="T"
                  domain={[0.5, 6.4]}
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  axisLine={{ stroke: "#CBD5E1" }}
                  tickLine={false}
                />
                <YAxis
                  type="number"
                  dataKey="roiPct"
                  name="ROI"
                  unit="%"
                  domain={[0, 25]}
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                />
                <ZAxis type="number" dataKey="subscribersM" range={[60, 460]} name="Subscribers (M)" />
                <ReferenceLine
                  y={10.5}
                  stroke={TELKOM_COLORS.coolGray}
                  strokeDasharray="4 4"
                  label={{
                    value: "WACC 10.5%",
                    position: "insideTopRight",
                    fill: "#64748B",
                    fontSize: 11,
                  }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload as RegionalClusterRisk;
                    return (
                      <div className="bg-white border border-slate-200 rounded-md p-3 shadow-sm text-xs space-y-1">
                        <div className="font-semibold text-slate-900">{d.cluster}</div>
                        <div className="text-slate-500">
                          {d.area} · {d.tier}
                        </div>
                        <div className="font-mono tabular-nums pt-1 text-slate-700">
                          CAPEX: Rp {d.capexIdrT.toFixed(2)}T · ROI: {d.roiPct.toFixed(1)}%
                        </div>
                        <div className="font-mono tabular-nums text-slate-600">
                          5G Cov: {d.coverage5GPct.toFixed(1)}% · 3T Cost: {d.costMultiplier3T.toFixed(2)}x · Subs: {d.subscribersM.toFixed(1)}M
                        </div>
                      </div>
                    );
                  }}
                />
                <Scatter data={clusters} name="Clusters">
                  {clusters.map((entry) => (
                    <Cell
                      key={entry.cluster}
                      fill={TIER_COLORS[entry.tier]}
                      fillOpacity={0.82}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Subsea Risk vs 3T Deployment Cost Index */}
        <section className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Infrastructure Vulnerability Index: Subsea Risk vs. 3T Cost
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Bubble size = Avg repair MTTR (days) · Shaded quadrant = High-Risk Red Zone (&gt;65 on both indices)
            </p>
          </div>

          <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 14, right: 16, left: -8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis
                  type="number"
                  dataKey="deployment3TCostIndex"
                  name="3T Cost Index"
                  domain={[25, 100]}
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  axisLine={{ stroke: "#CBD5E1" }}
                  tickLine={false}
                />
                <YAxis
                  type="number"
                  dataKey="subseaRiskScore"
                  name="Subsea Risk"
                  domain={[30, 100]}
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                />
                <ZAxis type="number" dataKey="avgRepairDays" range={[80, 420]} name="MTTR (Days)" />
                <ReferenceArea
                  x1={65}
                  x2={100}
                  y1={65}
                  y2={100}
                  fill="#E00000"
                  fillOpacity={0.07}
                  stroke="#E00000"
                  strokeOpacity={0.25}
                  strokeDasharray="3 3"
                />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload as SubseaCableRisk;
                    return (
                      <div className="bg-white border border-slate-200 rounded-md p-3 shadow-sm text-xs space-y-1">
                        <div className="font-semibold text-slate-900">{d.corridor}</div>
                        <div className="text-slate-500">
                          {d.area} · {d.primaryThreat}
                        </div>
                        <div className="font-mono tabular-nums pt-1 text-slate-700">
                          Subsea Risk: {d.subseaRiskScore}/100 · 3T Cost: {d.deployment3TCostIndex}/100
                        </div>
                        <div className="font-mono tabular-nums text-[#C50000]">
                          Outages (24M): {d.outages24M} · Avg MTTR: {d.avgRepairDays.toFixed(1)} days
                        </div>
                      </div>
                    );
                  }}
                />
                <Scatter data={cables} name="Corridors">
                  {cables.map((entry) => (
                    <Cell
                      key={entry.corridor}
                      fill={
                        entry.subseaRiskScore >= 75
                          ? TELKOM_COLORS.red
                          : entry.subseaRiskScore >= 60
                            ? TELKOM_COLORS.amber
                            : TELKOM_COLORS.slate
                      }
                      fillOpacity={0.85}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Row 3: 5G Mid-Band Spectrum Gap & Subsea Cable Register */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <section className="xl:col-span-5 bg-white border border-slate-200 rounded-lg p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-900">
              5G Spectrum Deficit (3.5 GHz &amp; 700 MHz Bottleneck)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Allocated spectrum vs. optimal 5G capacity requirement (MHz)
            </p>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={SPECTRUM_GAP_DATA}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={{ stroke: "#CBD5E1" }} tickLine={false} unit=" MHz" />
                <YAxis type="category" dataKey="band" width={118} tick={{ fontSize: 11, fill: "#334155" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#E2E8F0",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
                <Bar dataKey="allocatedMhz" name="Allocated (MHz)" stackId="spec" fill={TELKOM_COLORS.slate} />
                <Bar dataKey="deficitMhz" name="Spectrum Deficit (MHz)" stackId="spec" fill={TELKOM_COLORS.red} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="xl:col-span-7 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900">
              Subsea Cable &amp; 3T Backhaul Incident Register
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Corridors sorted by physical vulnerability index across selected regional areas
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                  <th className="py-2.5 px-5">Corridor</th>
                  <th className="py-2.5 px-3">Primary Threat</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Subsea Risk</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">3T Cost</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">Outages</th>
                  <th className="py-2.5 px-5 text-right whitespace-nowrap">Avg MTTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {cables.map((row) => (
                  <tr key={row.corridor} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-5">
                      <div className="font-medium text-slate-900">{row.corridor}</div>
                      <div className="text-[11px] text-slate-400">{row.area}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{row.primaryThreat}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${row.subseaRiskScore}%`,
                              backgroundColor:
                                row.subseaRiskScore >= 75
                                  ? TELKOM_COLORS.red
                                  : row.subseaRiskScore >= 60
                                    ? TELKOM_COLORS.amber
                                    : TELKOM_COLORS.slate,
                            }}
                          />
                        </div>
                        <span className="font-mono tabular-nums text-slate-700 font-medium">
                          {row.subseaRiskScore}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono tabular-nums text-slate-700">
                      {row.deployment3TCostIndex}/100
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-900 font-medium">
                      {row.outages24M}
                    </td>
                    <td className="py-3 px-5 text-right font-mono tabular-nums text-slate-700">
                      {row.avgRepairDays.toFixed(1)}d
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
