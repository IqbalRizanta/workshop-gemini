import { useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { KpiCard } from "../components/KpiCard";
import { SERVICE_TYPES, TELKOM_COLORS } from "../config/telkom2025";
import { runOttCannibalizationModel } from "../services/simulationEngine";
import type { OperationalRecord, ServiceTypeName } from "../types/telemetry";

interface RevenueMigrationTabProps {
  timeViewRecords: OperationalRecord[];
  areaSegRecords: OperationalRecord[];
}

const SERVICE_COLOR_MAP: Record<ServiceTypeName, string> = {
  "Mobile Data": TELKOM_COLORS.red,
  Voice: TELKOM_COLORS.slate,
  SMS: TELKOM_COLORS.amber,
  "IndiHome Fixed BB": TELKOM_COLORS.blue,
  "Digital & Enterprise": TELKOM_COLORS.emerald,
};

export function RevenueMigrationTab({
  timeViewRecords,
  areaSegRecords,
}: RevenueMigrationTabProps) {
  const [ottSpeedPct, setOttSpeedPct] = useState(26.5);
  const [dataOffsetCagrPct, setDataOffsetCagrPct] = useState(6.2);
  const [captureRatePct, setCaptureRatePct] = useState(38);

  // Aggregate service-level FY2024 vs FY2025 comparison
  const serviceSummary = useMemo(() => {
    const map = new Map<ServiceTypeName, { rev24B: number; rev25B: number }>();
    for (const s of SERVICE_TYPES) map.set(s, { rev24B: 0, rev25B: 0 });
    for (const r of areaSegRecords) {
      const entry = map.get(r.serviceType);
      if (!entry) continue;
      if (r.year === 2024) entry.rev24B += r.revenueIdrB;
      if (r.year === 2025) entry.rev25B += r.revenueIdrB;
    }
    return SERVICE_TYPES.map((svc) => {
      const e = map.get(svc)!;
      const deltaB = e.rev25B - e.rev24B;
      const yoyPct = e.rev24B > 0 ? (deltaB / e.rev24B) * 100 : 0;
      return {
        serviceType: svc,
        rev24T: e.rev24B / 1000,
        rev25T: e.rev25B / 1000,
        deltaT: deltaB / 1000,
        yoyPct,
      };
    });
  }, [areaSegRecords]);

  // Monthly time series pivoted by service type
  const monthlySeries = useMemo(() => {
    const byDate = new Map<string, Record<string, number | string>>();
    for (const r of timeViewRecords) {
      const key = r.date.slice(0, 7); // YYYY-MM
      if (!byDate.has(key)) {
        byDate.set(key, { month: key });
      }
      const row = byDate.get(key)!;
      row[r.serviceType] = Number((((row[r.serviceType] as number) ?? 0) + r.revenueIdrB).toFixed(1));
    }
    return Array.from(byDate.values()).sort((a, b) =>
      String(a.month).localeCompare(String(b.month))
    );
  }, [timeViewRecords]);

  // Waterfall bridge data (stacked invisible base + visible delta bar)
  const waterfallData = useMemo(() => {
    const total24 = serviceSummary.reduce((acc, s) => acc + s.rev24T, 0);
    const total25 = serviceSummary.reduce((acc, s) => acc + s.rev25T, 0);
    const order: ServiceTypeName[] = [
      "Voice",
      "SMS",
      "IndiHome Fixed BB",
      "Mobile Data",
      "Digital & Enterprise",
    ];
    let running = total24;
    const bars: Array<{
      name: string;
      base: number;
      value: number;
      rawDelta: number;
      kind: "total" | "up" | "down";
    }> = [
      { name: "FY 2024", base: 0, value: Number(total24.toFixed(2)), rawDelta: total24, kind: "total" },
    ];

    for (const svc of order) {
      const row = serviceSummary.find((s) => s.serviceType === svc);
      const delta = row ? row.deltaT : 0;
      const start = delta >= 0 ? running : running + delta;
      bars.push({
        name: svc === "IndiHome Fixed BB" ? "IndiHome" : svc === "Digital & Enterprise" ? "Digital/Ent." : svc,
        base: Number(Math.max(0, start).toFixed(2)),
        value: Number(Math.abs(delta).toFixed(2)),
        rawDelta: Number(delta.toFixed(2)),
        kind: delta >= 0 ? "up" : "down",
      });
      running += delta;
    }

    bars.push({
      name: "FY 2025",
      base: 0,
      value: Number(total25.toFixed(2)),
      rawDelta: total25,
      kind: "total",
    });
    return bars;
  }, [serviceSummary]);

  const bySvc = (svc: ServiceTypeName) =>
    serviceSummary.find((s) => s.serviceType === svc) ?? {
      rev25T: 0,
      yoyPct: 0,
      deltaT: 0,
    };

  const voice = bySvc("Voice");
  const sms = bySvc("SMS");
  const mobileData = bySvc("Mobile Data");
  const digital = bySvc("Digital & Enterprise");

  const ottProjection = useMemo(
    () =>
      runOttCannibalizationModel(
        voice.rev25T + sms.rev25T,
        mobileData.rev25T + digital.rev25T,
        ottSpeedPct,
        dataOffsetCagrPct,
        captureRatePct
      ),
    [voice.rev25T, sms.rev25T, mobileData.rev25T, digital.rev25T, ottSpeedPct, dataOffsetCagrPct, captureRatePct]
  );

  return (
    <div className="space-y-6">
      {/* Row 1: Service-Level YoY Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Voice Revenue (FY2025)"
          value={`Rp ${voice.rev25T.toFixed(2)}T`}
          deltaText={`${voice.yoyPct >= 0 ? "+" : ""}${voice.yoyPct.toFixed(1)}% YoY`}
          trend={voice.yoyPct >= 0 ? "positive" : "negative"}
          subtext={`${voice.deltaT >= 0 ? "+" : ""}${voice.deltaT.toFixed(2)}T`}
        />
        <KpiCard
          label="SMS Revenue (FY2025)"
          value={`Rp ${sms.rev25T.toFixed(2)}T`}
          deltaText={`${sms.yoyPct >= 0 ? "+" : ""}${sms.yoyPct.toFixed(1)}% YoY`}
          trend={sms.yoyPct >= 0 ? "positive" : "negative"}
          subtext={`${sms.deltaT >= 0 ? "+" : ""}${sms.deltaT.toFixed(2)}T`}
        />
        <KpiCard
          label="Mobile Data (FY2025)"
          value={`Rp ${mobileData.rev25T.toFixed(2)}T`}
          deltaText={`${mobileData.yoyPct >= 0 ? "+" : ""}${mobileData.yoyPct.toFixed(1)}% YoY`}
          trend={mobileData.yoyPct >= 0 ? "positive" : "negative"}
          subtext={`${mobileData.deltaT >= 0 ? "+" : ""}${mobileData.deltaT.toFixed(2)}T`}
        />
        <KpiCard
          label="Digital & Enterprise (FY2025)"
          value={`Rp ${digital.rev25T.toFixed(2)}T`}
          deltaText={`${digital.yoyPct >= 0 ? "+" : ""}${digital.yoyPct.toFixed(1)}% YoY`}
          trend={digital.yoyPct >= 0 ? "positive" : "negative"}
          subtext={`${digital.deltaT >= 0 ? "+" : ""}${digital.deltaT.toFixed(2)}T`}
        />
      </div>

      {/* Row 2: Monthly Trajectory & FY24->FY25 Variance Bridge */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <section className="xl:col-span-7 bg-white border border-slate-200 rounded-lg p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Monthly Service Revenue Trajectory (IDR Billion)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Voice and SMS contraction vs. Mobile Data, IndiHome, and Digital &amp; Enterprise expansion
            </p>
          </div>
          <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySeries} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={{ stroke: "#CBD5E1" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#E2E8F0",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                {SERVICE_TYPES.map((svc) => (
                  <Line
                    key={svc}
                    type="monotone"
                    dataKey={svc}
                    stroke={SERVICE_COLOR_MAP[svc]}
                    strokeWidth={svc === "Mobile Data" || svc === "Voice" ? 2.5 : 2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="xl:col-span-5 bg-white border border-slate-200 rounded-lg p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-900">
              FY2024 → FY2025 Revenue Variance Bridge (IDR Trillion)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown of legacy erosion offset by Mobile Data and Digital/Enterprise gains
            </p>
          </div>
          <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={waterfallData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={{ stroke: "#CBD5E1" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} unit="T" />
                <Tooltip
                  formatter={(_val: unknown, name: unknown, item: { payload?: { rawDelta: number; kind: string } }) => {
                    if (name === "base") return [null, null];
                    const p = item?.payload;
                    if (!p) return ["", ""];
                    const formatted =
                      p.kind === "total"
                        ? `Rp ${p.rawDelta.toFixed(2)}T`
                        : `${p.rawDelta >= 0 ? "+" : ""}Rp ${p.rawDelta.toFixed(2)}T`;
                    return [formatted, "Revenue Impact"];
                  }}
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#E2E8F0",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="base" stackId="wf" fill="transparent" isAnimationActive={false} />
                <Bar dataKey="value" stackId="wf" radius={[3, 3, 0, 0]}>
                  {waterfallData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={
                        entry.kind === "total"
                          ? TELKOM_COLORS.slate
                          : entry.kind === "up"
                            ? TELKOM_COLORS.emerald
                            : TELKOM_COLORS.red
                      }
                    />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Row 3: Interactive OTT Cannibalization Impact Model */}
      <section className="bg-white border border-slate-200 rounded-lg p-5 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Interactive OTT Cannibalization &amp; Legacy Run-Off Model (2025–2028)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Stress-test the pace of WhatsApp/VoIP legacy substitution against Data &amp; Digital conversion growth
            </p>
          </div>
          <div className="font-mono tabular-nums text-xs text-slate-600">
            2028 Projected Legacy Share:{" "}
            <span className="font-semibold text-[#C50000]">
              {ottProjection[ottProjection.length - 1]?.legacySharePct.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pb-2 border-b border-slate-100">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-slate-700">Annual Voice/SMS OTT Erosion</span>
              <span className="font-mono tabular-nums font-semibold text-slate-900">
                {ottSpeedPct.toFixed(1)}% / yr
              </span>
            </div>
            <input
              type="range"
              min={15}
              max={40}
              step={0.5}
              value={ottSpeedPct}
              onChange={(e) => setOttSpeedPct(Number(e.target.value))}
              className="w-full telkom-slider"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-slate-700">Data &amp; Digital Conversion CAGR</span>
              <span className="font-mono tabular-nums font-semibold text-slate-900">
                {dataOffsetCagrPct.toFixed(1)}% / yr
              </span>
            </div>
            <input
              type="range"
              min={2}
              max={14}
              step={0.2}
              value={dataOffsetCagrPct}
              onChange={(e) => setDataOffsetCagrPct(Number(e.target.value))}
              className="w-full telkom-slider"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-slate-700">Legacy-to-Data Value Recapture</span>
              <span className="font-mono tabular-nums font-semibold text-slate-900">
                {captureRatePct}%
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={75}
              step={1}
              value={captureRatePct}
              onChange={(e) => setCaptureRatePct(Number(e.target.value))}
              className="w-full telkom-slider"
            />
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={ottProjection} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={{ stroke: "#CBD5E1" }} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} unit="T" />
              <YAxis yAxisId="right" orientation="right" domain={[0, 22]} tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#E2E8F0",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              <Bar yAxisId="left" dataKey="dataDigitalIdrT" name="Data & Digital Core (IDR T)" stackId="ott" fill={TELKOM_COLORS.slate} />
              <Bar yAxisId="left" dataKey="legacyIdrT" name="Legacy Voice & SMS (IDR T)" stackId="ott" fill={TELKOM_COLORS.red} radius={[3, 3, 0, 0]} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="legacySharePct"
                name="Legacy Share (%)"
                stroke={TELKOM_COLORS.amber}
                strokeWidth={2.5}
                dot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
