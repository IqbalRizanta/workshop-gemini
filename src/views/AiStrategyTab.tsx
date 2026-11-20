import { useState } from "react";
import { AlertCircle, ArrowRight, Download, Loader2 } from "lucide-react";
import { CONSTRAINT_PRESETS, PROBLEM_AREAS } from "../config/telkom2025";
import type { AiStrategyPlan, KpiSnapshot } from "../types/telemetry";

interface AiStrategyTabProps {
  selectedProblemId: string;
  onSelectProblemId: (id: string) => void;
  kpis: KpiSnapshot;
  activeScope: string;
}

function buildMarkdownExport(
  problemTitle: string,
  activeScope: string,
  plan: AiStrategyPlan
): string {
  const lines: string[] = [
    `# PT Telkom Indonesia & Telkomsel — Strategic Action Plan`,
    `**Challenge:** ${problemTitle}`,
    `**Active Dashboard Scope:** ${activeScope}`,
    "",
    "## Executive Summary",
    plan.executiveSummary,
    "",
    "## Root-Cause Diagnosis",
    ...plan.rootCauseDiagnosis.map((d) => `- ${d}`),
    "",
    "## 3-Step Mitigation Strategy",
    ...plan.mitigationSteps.flatMap((s) => [
      `### Step ${s.stepNumber}: ${s.title} (${s.horizon})`,
      `**Primary Lever:** ${s.lever}`,
      ...s.actions.map((a) => `- ${a}`),
      "",
    ]),
    "## 18-Month Execution Timeline",
    "| Phase | Quarter | Key Deliverables | Executive Owner |",
    "| :--- | :--- | :--- | :--- |",
    ...plan.executionTimeline.map(
      (r) => `| ${r.phase} | ${r.quarter} | ${r.deliverables} | ${r.owner} |`
    ),
    "",
    "## Quantified ROI & Financial Impact Forecast",
    `- **Revenue Impact:** ${plan.roiForecast.revenueImpactIdrT}`,
    `- **EBITDA Margin Impact:** ${plan.roiForecast.ebitdaMarginBps}`,
    `- **Estimated Strategic ROI:** ${plan.roiForecast.estimatedRoiMultiple}`,
    `- **Payback Period:** ${plan.roiForecast.paybackPeriod}`,
    "",
    "### Risk Guardrails",
    ...plan.roiForecast.riskGuardrails.map((g) => `- ${g}`),
  ];
  return lines.join("\n");
}

export function AiStrategyTab({
  selectedProblemId,
  onSelectProblemId,
  kpis,
  activeScope,
}: AiStrategyTabProps) {
  const [customNotes, setCustomNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    problemTitle: string;
    generatedAt: string;
    scope: string;
    plan: AiStrategyPlan;
  } | null>(null);

  const selectedProblem =
    PROBLEM_AREAS.find((p) => p.id === selectedProblemId) ?? PROBLEM_AREAS[0];

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: selectedProblem.id,
          problemTitle: `${selectedProblem.index}. ${selectedProblem.title} (${selectedProblem.headlineMetric})`,
          problemSummary: selectedProblem.summary,
          problemSeverity: selectedProblem.severity,
          kpiFocus: selectedProblem.kpiFocus,
          customNotes,
          activeScope,
          telemetry: {
            revenueT: kpis.revenue2025T,
            revenueYoYPct: kpis.revenueYoYPct,
            mobileSubsM: kpis.mobileSubs2025M,
            mobileSubsDeltaM: kpis.mobileSubsDeltaM,
            arpuK: kpis.arpu2025K,
            arpuYoYPct: kpis.arpuYoYPct,
            coverage5GPct: kpis.coverage5G2025Pct,
            coverage5GDeltaPp: kpis.coverage5GDeltaPp,
            churnRatePct: kpis.churn2025Pct,
            churnDeltaPp: kpis.churnDeltaPp,
            voiceYoYPct: kpis.voiceYoYPct,
            smsYoYPct: kpis.smsYoYPct,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Server responded with HTTP ${response.status}`);
      }

      setResult({
        problemTitle: `${selectedProblem.index}. ${selectedProblem.title}`,
        generatedAt: data.generatedAt,
        scope: activeScope,
        plan: data.plan as AiStrategyPlan,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate strategic action plan.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!result) return;
    const md = buildMarkdownExport(result.problemTitle, result.scope, result.plan);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `telkom_2025_strategy_${selectedProblem.id}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const appendPreset = (preset: string) => {
    setCustomNotes((prev) => (prev.trim() ? `${prev.trim()}\n- ${preset}` : `- ${preset}`));
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
      {/* Left Column: Challenge Selector & Constraints */}
      <section className="xl:col-span-5 bg-white border border-slate-200 rounded-lg p-5 space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Strategic Solution Configurator
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Live filtered KPIs are injected automatically into the strategy synthesis prompt.
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="problem-area-select"
            className="block text-xs font-semibold text-slate-800"
          >
            Target FY2025 Challenge Area
          </label>
          <select
            id="problem-area-select"
            value={selectedProblem.id}
            onChange={(e) => onSelectProblemId(e.target.value)}
            className="w-full px-3 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E00000]/25 focus:border-[#E00000]"
          >
            {PROBLEM_AREAS.map((area) => (
              <option key={area.id} value={area.id}>
                {area.index}. {area.title} ({area.headlineMetric})
              </option>
            ))}
          </select>
        </div>

        {/* Selected Problem Diagnostic Brief */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-md space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-900">
              Severity:{" "}
              <span
                className={
                  selectedProblem.severity === "Critical"
                    ? "text-[#C50000]"
                    : selectedProblem.severity === "High"
                      ? "text-amber-700"
                      : "text-slate-700"
                }
              >
                {selectedProblem.severity}
              </span>
            </span>
            <span className="font-mono tabular-nums text-[11px] text-slate-500">
              {selectedProblem.headlineMetric}
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">{selectedProblem.summary}</p>
          <div className="pt-1 border-t border-slate-200/70 text-[11px] text-slate-500">
            <span className="font-medium text-slate-700">Primary KPIs: </span>
            {selectedProblem.kpiFocus}
          </div>
        </div>

        {/* Live Injected Telemetry Preview */}
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-slate-800">
            Live Telemetry Context Attached
          </div>
          <div className="grid grid-cols-3 gap-2 font-mono tabular-nums text-[11px] text-slate-600 bg-slate-50/70 border border-slate-100 rounded-md p-2.5">
            <div>
              <div className="text-slate-400">Revenue</div>
              <div className="font-semibold text-slate-900">Rp {kpis.revenue2025T.toFixed(1)}T</div>
            </div>
            <div>
              <div className="text-slate-400">Mobile Subs</div>
              <div className="font-semibold text-slate-900">{kpis.mobileSubs2025M.toFixed(1)}M</div>
            </div>
            <div>
              <div className="text-slate-400">Churn</div>
              <div className="font-semibold text-slate-900">{kpis.churn2025Pct.toFixed(2)}%</div>
            </div>
          </div>
        </div>

        {/* Custom Constraints */}
        <div className="space-y-2">
          <label
            htmlFor="custom-constraints"
            className="block text-xs font-semibold text-slate-800"
          >
            Operational Constraints &amp; Executive Notes (Optional)
          </label>
          <textarea
            id="custom-constraints"
            rows={4}
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
            placeholder="Specify CAPEX ceilings, regional priorities, partner preferences, or regulatory guardrails..."
            className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E00000]/25 focus:border-[#E00000] resize-y"
          />
          <div className="space-y-1">
            <div className="text-[11px] text-slate-400">Add quick constraint:</div>
            <div className="flex flex-wrap gap-1.5">
              {CONSTRAINT_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => appendPreset(preset)}
                  className="text-left text-[11px] px-2.5 py-1 rounded border border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-900 transition-colors"
                >
                  + {preset.slice(0, 44)}
                  {preset.length > 44 ? "…" : ""}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#E00000] hover:bg-[#B80000] disabled:opacity-60 disabled:cursor-not-allowed rounded-md transition-colors whitespace-nowrap"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Synthesizing Strategic Action Plan...</span>
            </>
          ) : (
            <>
              <span>Generate Strategic Action Plan</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {error && (
          <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-md text-xs text-[#A60000]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}
      </section>

      {/* Right Column: Structured Boardroom Action Plan Output */}
      <section className="xl:col-span-7 bg-white border border-slate-200 rounded-lg p-6 min-h-[540px]">
        {loading ? (
          <div className="space-y-5 animate-pulse">
            <div className="h-5 bg-slate-200 rounded w-2/3" />
            <div className="h-4 bg-slate-100 rounded w-full" />
            <div className="h-4 bg-slate-100 rounded w-5/6" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <div className="h-16 bg-slate-100 rounded-md" />
              <div className="h-16 bg-slate-100 rounded-md" />
              <div className="h-16 bg-slate-100 rounded-md" />
              <div className="h-16 bg-slate-100 rounded-md" />
            </div>
            <div className="h-32 bg-slate-100 rounded-md" />
            <div className="h-32 bg-slate-100 rounded-md" />
          </div>
        ) : result ? (
          <div className="space-y-6">
            {/* Header & Export */}
            <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {result.problemTitle}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Scope: {result.scope} · Generated{" "}
                  {new Date(result.generatedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadMarkdown}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-950 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                Download Plan (.md)
              </button>
            </div>

            {/* Executive Summary */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-slate-900">Executive Synthesis</h4>
              <p className="text-sm text-slate-700 leading-relaxed">
                {result.plan.executiveSummary}
              </p>
            </div>

            {/* Quantified ROI Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-md">
                <div className="text-[11px] text-slate-500">Revenue Impact</div>
                <div className="font-mono tabular-nums text-xs font-semibold text-slate-900 mt-1">
                  {result.plan.roiForecast.revenueImpactIdrT}
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-md">
                <div className="text-[11px] text-slate-500">EBITDA Margin</div>
                <div className="font-mono tabular-nums text-xs font-semibold text-emerald-700 mt-1">
                  {result.plan.roiForecast.ebitdaMarginBps}
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-md">
                <div className="text-[11px] text-slate-500">Estimated ROI</div>
                <div className="font-mono tabular-nums text-xs font-semibold text-slate-900 mt-1">
                  {result.plan.roiForecast.estimatedRoiMultiple}
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-md">
                <div className="text-[11px] text-slate-500">Payback Window</div>
                <div className="font-mono tabular-nums text-xs font-semibold text-slate-900 mt-1">
                  {result.plan.roiForecast.paybackPeriod}
                </div>
              </div>
            </div>

            {/* Root-Cause Diagnosis */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-900">
                1. Executive Root-Cause Diagnosis
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700 list-disc pl-4 leading-relaxed">
                {result.plan.rootCauseDiagnosis.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            {/* 3-Step Mitigation Strategy */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-900">
                2. Structured 3-Step Mitigation Strategy
              </h4>
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-md">
                {result.plan.mitigationSteps.map((step) => (
                  <div key={step.stepNumber} className="p-4 space-y-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="text-xs font-semibold text-slate-900">
                        <span className="font-mono tabular-nums text-[#E00000] mr-1.5">
                          0{step.stepNumber}.
                        </span>
                        {step.title}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {step.horizon} · <span className="font-medium text-slate-700">{step.lever}</span>
                      </div>
                    </div>
                    <ul className="space-y-1 text-xs text-slate-600 list-disc pl-4 leading-relaxed">
                      {step.actions.map((act, i) => (
                        <li key={i}>{act}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* 18-Month Execution Timeline */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-900">
                3. 18-Month Execution Timeline
              </h4>
              <div className="border border-slate-200 rounded-md overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                      <th className="py-2 px-3 whitespace-nowrap">Phase</th>
                      <th className="py-2 px-3 whitespace-nowrap">Quarter</th>
                      <th className="py-2 px-3">Key Deliverables</th>
                      <th className="py-2 px-3 whitespace-nowrap">Owner</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.plan.executionTimeline.map((row, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-medium text-slate-900 whitespace-nowrap">
                          {row.phase}
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                          {row.quarter}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 leading-relaxed">
                          {row.deliverables}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                          {row.owner}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Risk Guardrails */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <h4 className="text-xs font-semibold text-slate-900">
                4. Financial &amp; Regulatory Risk Guardrails
              </h4>
              <ul className="space-y-1 text-xs text-slate-600 list-disc pl-4 leading-relaxed">
                {result.plan.roiForecast.riskGuardrails.map((guard, i) => (
                  <li key={i}>{guard}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="h-full min-h-[460px] flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-3">
            <h4 className="text-base font-semibold text-slate-900">
              Ready to Synthesize Executive Strategy
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Select one of the seven FY2025 PT Telkom Indonesia &amp; Telkomsel operational
              challenges on the left, add any CAPEX or regional constraints, and click{" "}
              <span className="font-semibold text-slate-700">Generate Strategic Action Plan</span>.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              The strategy engine receives your live filtered KPIs (Revenue, Mobile Subscribers,
              ARPU, 5G Coverage, and Churn) and produces a structured 3-step mitigation roadmap,
              18-month timeline, and quantified ROI forecast.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
