import { useMemo, useState } from "react";
import { Download, Menu } from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import {
  AREAS,
  DEFAULT_CALIBRATION,
  PROBLEM_AREAS,
  SEGMENTS,
  SERVICE_TYPES,
} from "./config/telkom2025";
import {
  buildCsvTemplate,
  computeKpiSnapshot,
  filterRecords,
  generateCoreOperationalData,
  parseOperationalCsv,
} from "./services/dataEngine";
import type {
  DashboardTabId,
  DataSourceMode,
  FilterState,
  OperationalRecord,
  ScenarioCalibration,
} from "./types/telemetry";
import { AiStrategyTab } from "./views/AiStrategyTab";
import { ExecutiveOverviewTab } from "./views/ExecutiveOverviewTab";
import { InfrastructureRiskTab } from "./views/InfrastructureRiskTab";
import { RetentionSimulatorTab } from "./views/RetentionSimulatorTab";
import { RevenueMigrationTab } from "./views/RevenueMigrationTab";

const TABS: Array<{ id: DashboardTabId; label: string; shortLabel: string }> = [
  { id: "executive", label: "Executive Overview", shortLabel: "Overview" },
  { id: "revenue", label: "Revenue & Legacy Migration", shortLabel: "Revenue" },
  { id: "simulator", label: "Retention & ARPU Simulator", shortLabel: "Simulator" },
  { id: "infrastructure", label: "Infra, 5G & Cable Risk", shortLabel: "Infra & 5G" },
  { id: "ai-strategy", label: "AI Strategy Generator", shortLabel: "AI Strategy" },
];

const INITIAL_FILTERS: FilterState = {
  areas: [...AREAS],
  segments: [...SEGMENTS],
  services: [...SERVICE_TYPES],
  timeRange: "2024 vs 2025 (YoY)",
};

export default function App() {
  const [activeTab, setActiveTab] = useState<DashboardTabId>("executive");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Dynamic Data Source & Scenario Calibration State
  const [dataSource, setDataSource] = useState<DataSourceMode>("calibrated");
  const [calibration, setCalibration] = useState<ScenarioCalibration>({ ...DEFAULT_CALIBRATION });
  const [uploadedRecords, setUploadedRecords] = useState<OperationalRecord[] | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Analytical Filters State
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [selectedProblemId, setSelectedProblemId] = useState<string>(PROBLEM_AREAS[0].id);

  // Baseline calibrated records for CSV template export and live modeling
  const calibratedRecords = useMemo(
    () => generateCoreOperationalData(calibration),
    [calibration]
  );

  const activeRecords = useMemo(() => {
    if (dataSource === "uploaded" && uploadedRecords && uploadedRecords.length > 0) {
      return uploadedRecords;
    }
    return calibratedRecords;
  }, [dataSource, uploadedRecords, calibratedRecords]);

  const filteredRecords = useMemo(
    () => filterRecords(activeRecords, filters),
    [activeRecords, filters]
  );

  const areaSegRecords = useMemo(
    () =>
      filterRecords(activeRecords, {
        areas: filters.areas,
        segments: filters.segments,
        services: SERVICE_TYPES,
      }),
    [activeRecords, filters.areas, filters.segments]
  );

  const timeViewRecords = useMemo(() => {
    if (filters.timeRange === "2025 Only") {
      return filteredRecords.filter((r) => r.year === 2025);
    }
    if (filters.timeRange === "2024 Only") {
      return filteredRecords.filter((r) => r.year === 2024);
    }
    return filteredRecords;
  }, [filteredRecords, filters.timeRange]);

  const kpis = useMemo(
    () => computeKpiSnapshot(filteredRecords, areaSegRecords),
    [filteredRecords, areaSegRecords]
  );

  const hasEmptyFilter =
    filters.areas.length === 0 ||
    filters.segments.length === 0 ||
    filters.services.length === 0;

  const activeScopeLabel = `${filters.areas.length}/4 Areas · ${filters.segments.join(", ")} · ${filters.services.length}/5 Services · ${filters.timeRange}`;

  const dataSourceLabel =
    dataSource === "uploaded" && uploadedFileName
      ? `Uploaded CSV (${uploadedFileName})`
      : "FY2025 Annual Report Calibrated Model";

  const handleCsvUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      const { records, error } = parseOperationalCsv(text);
      if (error || !records) {
        setUploadError(error ?? "Unable to parse CSV file.");
        return;
      }
      setUploadedRecords(records);
      setUploadedFileName(file.name);
      setUploadError(null);
      setDataSource("uploaded");
    };
    reader.onerror = () => {
      setUploadError("Failed to read file from disk.");
    };
    reader.readAsText(file);
  };

  const handleDownloadCsv = (recordsToExport: OperationalRecord[], filename: string) => {
    const csv = buildCsvTemplate(recordsToExport);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleResetAll = () => {
    setDataSource("calibrated");
    setCalibration({ ...DEFAULT_CALIBRATION });
    setUploadedRecords(null);
    setUploadedFileName(null);
    setUploadError(null);
    setFilters(INITIAL_FILTERS);
  };

  const handleJumpToAiStrategy = (problemId: string) => {
    setSelectedProblemId(problemId);
    setActiveTab("ai-strategy");
  };

  const activeTabMeta = TABS.find((t) => t.id === activeTab) ?? TABS[0];

  return (
    <div className="min-h-screen flex bg-[#F7F8FA] text-slate-900">
      <Sidebar
        dataSource={dataSource}
        onDataSourceChange={setDataSource}
        uploadedFileName={uploadedFileName}
        uploadError={uploadError}
        onCsvUpload={handleCsvUpload}
        onClearUpload={() => {
          setUploadedRecords(null);
          setUploadedFileName(null);
          setUploadError(null);
          setDataSource("calibrated");
        }}
        onDownloadTemplate={() =>
          handleDownloadCsv(
            generateCoreOperationalData(DEFAULT_CALIBRATION),
            "telkomsel_2025_operational_template.csv"
          )
        }
        calibration={calibration}
        onCalibrationChange={setCalibration}
        filters={filters}
        onFiltersChange={setFilters}
        onResetAll={handleResetAll}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Workspace Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-5 lg:px-7 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open filters sidebar"
              className="lg:hidden p-1.5 -ml-1.5 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              <Menu className="w-5 h-5" />
            </button>
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 text-xs text-slate-500 min-w-0 truncate"
            >
              <span className="font-semibold text-slate-900 whitespace-nowrap">
                PT Telkom Indonesia &amp; Telkomsel
              </span>
              <span aria-hidden="true">/</span>
              <span className="hidden sm:inline whitespace-nowrap">FY2025 Strategy</span>
              <span className="hidden sm:inline" aria-hidden="true">
                /
              </span>
              <span className="font-medium text-[#E00000] truncate">{activeTabMeta.label}</span>
            </nav>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() =>
                handleDownloadCsv(filteredRecords, "telkom_2025_filtered_telemetry.csv")
              }
              disabled={hasEmptyFilter}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </header>

        {/* Sub-header: Active Scope + Primary Module Navigation Tabs */}
        <div className="bg-white border-b border-slate-200 px-5 lg:px-7 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 pb-3">
            <h1 className="text-lg font-bold tracking-tight text-slate-900">
              {activeTabMeta.label}
            </h1>
            <div className="text-xs text-slate-500 truncate">
              <span>{dataSourceLabel}</span>
              <span className="mx-2" aria-hidden="true">
                ·
              </span>
              <span>{activeScopeLabel}</span>
            </div>
          </div>

          <div
            role="tablist"
            aria-label="Dashboard sections"
            className="flex items-center gap-6 overflow-x-auto -mb-px"
          >
            {TABS.map((tab, idx) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? "border-[#E00000] text-[#E00000]"
                      : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
                  }`}
                >
                  <span className="font-mono tabular-nums text-[11px] mr-1.5 opacity-70">
                    0{idx + 1}
                  </span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Viewport */}
        <main className="flex-1 p-5 lg:p-7 max-w-[1440px] w-full mx-auto">
          {hasEmptyFilter ? (
            <div className="bg-white border border-slate-200 rounded-lg p-10 text-center max-w-lg mx-auto my-8 space-y-3">
              <h2 className="text-sm font-semibold text-slate-900">
                No telemetry matches your current filter selection
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Select at least one Regional Area, Customer Segment, and Service Type in the
                sidebar to display operational KPIs and simulations.
              </p>
              <button
                type="button"
                onClick={() => setFilters(INITIAL_FILTERS)}
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-[#E00000] hover:bg-[#B80000] rounded-md transition-colors"
              >
                Restore All Filters
              </button>
            </div>
          ) : (
            <>
              {activeTab === "executive" && (
                <ExecutiveOverviewTab
                  kpis={kpis}
                  timeRange={filters.timeRange}
                  onSelectProblemForAi={handleJumpToAiStrategy}
                />
              )}
              {activeTab === "revenue" && (
                <RevenueMigrationTab
                  timeViewRecords={timeViewRecords}
                  areaSegRecords={areaSegRecords}
                />
              )}
              {activeTab === "simulator" && <RetentionSimulatorTab kpis={kpis} />}
              {activeTab === "infrastructure" && (
                <InfrastructureRiskTab selectedAreas={filters.areas} />
              )}
              {activeTab === "ai-strategy" && (
                <AiStrategyTab
                  selectedProblemId={selectedProblemId}
                  onSelectProblemId={setSelectedProblemId}
                  kpis={kpis}
                  activeScope={activeScopeLabel}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
