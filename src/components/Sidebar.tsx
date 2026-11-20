import { useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  RotateCcw,
  SlidersHorizontal,
  Upload,
  X,
} from "lucide-react";
import {
  AREAS,
  DEFAULT_CALIBRATION,
  SEGMENTS,
  SERVICE_TYPES,
} from "../config/telkom2025";
import type {
  AreaName,
  DataSourceMode,
  FilterState,
  ScenarioCalibration,
  SegmentName,
  ServiceTypeName,
  TimeRangeOption,
} from "../types/telemetry";

interface SidebarProps {
  dataSource: DataSourceMode;
  onDataSourceChange: (mode: DataSourceMode) => void;
  uploadedFileName: string | null;
  uploadError: string | null;
  onCsvUpload: (file: File) => void;
  onClearUpload: () => void;
  onDownloadTemplate: () => void;
  calibration: ScenarioCalibration;
  onCalibrationChange: (next: ScenarioCalibration) => void;
  filters: FilterState;
  onFiltersChange: (next: FilterState) => void;
  onResetAll: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

const TIME_OPTIONS: TimeRangeOption[] = ["2024 vs 2025 (YoY)", "2025 Only", "2024 Only"];

export function Sidebar({
  dataSource,
  onDataSourceChange,
  uploadedFileName,
  uploadError,
  onCsvUpload,
  onClearUpload,
  onDownloadTemplate,
  calibration,
  onCalibrationChange,
  filters,
  onFiltersChange,
  onResetAll,
  isOpenMobile,
  onCloseMobile,
}: SidebarProps) {
  const [calibrationOpen, setCalibrationOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const toggleArea = (area: AreaName) => {
    const exists = filters.areas.includes(area);
    const next = exists
      ? filters.areas.filter((a) => a !== area)
      : [...filters.areas, area];
    onFiltersChange({ ...filters, areas: next });
  };

  const toggleSegment = (seg: SegmentName) => {
    const exists = filters.segments.includes(seg);
    const next = exists
      ? filters.segments.filter((s) => s !== seg)
      : [...filters.segments, seg];
    onFiltersChange({ ...filters, segments: next });
  };

  const toggleService = (svc: ServiceTypeName) => {
    const exists = filters.services.includes(svc);
    const next = exists
      ? filters.services.filter((s) => s !== svc)
      : [...filters.services, svc];
    onFiltersChange({ ...filters, services: next });
  };

  const isCalibrationModified =
    calibration.voiceYoYPct !== DEFAULT_CALIBRATION.voiceYoYPct ||
    calibration.smsYoYPct !== DEFAULT_CALIBRATION.smsYoYPct ||
    calibration.subs2025M !== DEFAULT_CALIBRATION.subs2025M;

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-[280px] shrink-0">
      {/* Brand header */}
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-xs bg-[#E00000] shrink-0" />
            <span className="text-sm font-bold tracking-tight text-slate-900 whitespace-nowrap">
              Telkom Group
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 truncate">
            FY2025 Strategy Command
          </p>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation sidebar"
          className="lg:hidden p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable controls */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        {/* Data Source Mode */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-900">Data Source</h2>
            <button
              type="button"
              onClick={onResetAll}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-[#E00000] transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-md">
            <button
              type="button"
              onClick={() => onDataSourceChange("calibrated")}
              className={`px-2 py-1.5 text-xs font-medium rounded-sm transition-colors whitespace-nowrap ${
                dataSource === "calibrated"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              2025 Model
            </button>
            <button
              type="button"
              onClick={() => onDataSourceChange("uploaded")}
              className={`px-2 py-1.5 text-xs font-medium rounded-sm transition-colors whitespace-nowrap ${
                dataSource === "uploaded"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Upload CSV
            </button>
          </div>

          {dataSource === "uploaded" ? (
            <div className="space-y-2.5 pt-1">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onCsvUpload(file);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-800 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-md transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-[#E00000]" />
                <span>{uploadedFileName ? "Replace CSV Dataset" : "Upload Operational CSV"}</span>
              </button>

              {uploadedFileName && (
                <div className="flex items-center justify-between gap-2 text-xs text-emerald-700 bg-emerald-50/70 border border-emerald-200 rounded-md px-2.5 py-1.5">
                  <span className="truncate font-medium">{uploadedFileName}</span>
                  <button
                    type="button"
                    onClick={onClearUpload}
                    className="text-emerald-800 hover:text-slate-900 shrink-0"
                    aria-label="Remove uploaded CSV"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {uploadError && (
                <p className="text-xs text-[#C50000] leading-relaxed">{uploadError}</p>
              )}

              <button
                type="button"
                onClick={onDownloadTemplate}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-md transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV Template</span>
              </button>
            </div>
          ) : (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setCalibrationOpen((v) => !v)}
                className="w-full flex items-center justify-between py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900"
              >
                <span className="inline-flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                  Live Scenario Calibration
                </span>
                {calibrationOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {calibrationOpen && (
                <div className="mt-2 space-y-3 pt-2 border-t border-slate-100">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-600">Voice YoY Shock</span>
                      <span className="font-mono tabular-nums font-medium text-slate-900">
                        {calibration.voiceYoYPct.toFixed(1)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-50}
                      max={-5}
                      step={0.2}
                      value={calibration.voiceYoYPct}
                      onChange={(e) =>
                        onCalibrationChange({
                          ...calibration,
                          voiceYoYPct: Number(e.target.value),
                        })
                      }
                      className="w-full telkom-slider"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-600">SMS YoY Shock</span>
                      <span className="font-mono tabular-nums font-medium text-slate-900">
                        {calibration.smsYoYPct.toFixed(1)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-40}
                      max={-2}
                      step={0.2}
                      value={calibration.smsYoYPct}
                      onChange={(e) =>
                        onCalibrationChange({
                          ...calibration,
                          smsYoYPct: Number(e.target.value),
                        })
                      }
                      className="w-full telkom-slider"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-600">FY2025 Mobile Subs</span>
                      <span className="font-mono tabular-nums font-medium text-slate-900">
                        {calibration.subs2025M.toFixed(1)}M
                      </span>
                    </div>
                    <input
                      type="range"
                      min={140}
                      max={168}
                      step={0.1}
                      value={calibration.subs2025M}
                      onChange={(e) =>
                        onCalibrationChange({
                          ...calibration,
                          subs2025M: Number(e.target.value),
                        })
                      }
                      className="w-full telkom-slider"
                    />
                  </div>

                  {isCalibrationModified && (
                    <button
                      type="button"
                      onClick={() => onCalibrationChange({ ...DEFAULT_CALIBRATION })}
                      className="text-xs font-medium text-[#E00000] hover:underline"
                    >
                      Restore FY2025 Annual Report defaults
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        <div className="border-t border-slate-100" />

        {/* Time Range */}
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-slate-900">Time Range</h2>
          <div className="space-y-1">
            {TIME_OPTIONS.map((opt) => {
              const active = filters.timeRange === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onFiltersChange({ ...filters, timeRange: opt })}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center justify-between ${
                    active
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span>{opt}</span>
                  {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        </section>

        <div className="border-t border-slate-100" />

        {/* Regional Areas */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-900">Regional Area</h2>
            <span className="font-mono tabular-nums text-[11px] text-slate-400">
              {filters.areas.length}/{AREAS.length}
            </span>
          </div>
          <div className="space-y-1.5">
            {AREAS.map((area) => {
              const checked = filters.areas.includes(area);
              return (
                <label
                  key={area}
                  className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none py-0.5 hover:text-slate-950"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleArea(area)}
                    className="rounded border-slate-300 text-[#E00000] accent-[#E00000] w-3.5 h-3.5"
                  />
                  <span className="truncate">{area}</span>
                </label>
              );
            })}
          </div>
        </section>

        <div className="border-t border-slate-100" />

        {/* Customer Segment */}
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-slate-900">Customer Segment</h2>
          <div className="grid grid-cols-2 gap-2">
            {SEGMENTS.map((seg) => {
              const active = filters.segments.includes(seg);
              return (
                <button
                  key={seg}
                  type="button"
                  onClick={() => toggleSegment(seg)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                    active
                      ? "bg-[#E00000]/8 border-[#E00000] text-[#990000]"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {seg}
                </button>
              );
            })}
          </div>
        </section>

        <div className="border-t border-slate-100" />

        {/* Service Types */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-900">Service Type</h2>
            <span className="font-mono tabular-nums text-[11px] text-slate-400">
              {filters.services.length}/{SERVICE_TYPES.length}
            </span>
          </div>
          <div className="space-y-1.5">
            {SERVICE_TYPES.map((svc) => {
              const checked = filters.services.includes(svc);
              return (
                <label
                  key={svc}
                  className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none py-0.5 hover:text-slate-950"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleService(svc)}
                    className="rounded border-slate-300 text-[#E00000] accent-[#E00000] w-3.5 h-3.5"
                  />
                  <span className="truncate">{svc}</span>
                </label>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop persistent sidebar */}
      <aside className="hidden lg:block sticky top-0 h-screen">{content}</aside>

      {/* Mobile slide-over drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{content}</div>
        </div>
      )}
    </>
  );
}
