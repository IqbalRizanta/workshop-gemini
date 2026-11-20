import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  deltaText: string;
  trend: "positive" | "negative" | "neutral";
  subtext?: string;
}

export function KpiCard({ label, value, deltaText, trend, subtext }: KpiCardProps) {
  const trendColor =
    trend === "positive"
      ? "text-emerald-700"
      : trend === "negative"
        ? "text-[#C50000]"
        : "text-slate-500";

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between gap-2.5">
      <div className="text-xs font-medium text-slate-500 leading-snug">{label}</div>
      <div className="font-mono tabular-nums text-2xl font-semibold text-slate-900 tracking-tight">
        {value}
      </div>
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
        <span className={`inline-flex items-center gap-1 font-mono tabular-nums text-xs font-medium ${trendColor}`}>
          {trend === "positive" && <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />}
          {trend === "negative" && <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />}
          {trend === "neutral" && <Minus className="w-3.5 h-3.5 shrink-0" />}
          <span>{deltaText}</span>
        </span>
        {subtext && (
          <span className="text-[11px] text-slate-400 truncate">{subtext}</span>
        )}
      </div>
    </div>
  );
}
