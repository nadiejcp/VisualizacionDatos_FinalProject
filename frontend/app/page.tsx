"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  AVAILABLE_COUNTRIES,
  AVAILABLE_YEARS,
  AVAILABLE_GASES,
} from "../lib/emissionsData";
import {
  getGlobalSummary,
  getTopEmitters,
  getGasComposition,
  getEmissionsTimeline,
  getCountryDeepStats,
  compareTwoCountries,
  generateEnvironmentalInsights,
  formatEmissionsValue,
  CountryRanking,
  GasCompositionItem,
  TimelinePoint,
  InsightAlert,
} from "../lib/dataProcessor";
import {
  getGasTheme,
  getTrendTheme,
  UI_PALETTE,
  GAS_PALETTE,
} from "../lib/theme";
import { WorldMap } from "../components/WorldMap";

// Color assignment array for drag-and-drop plotted countries
const COUNTRY_COLORS = UI_PALETTE.chartColors;

export default function Home() {
  // Interactive State
  const [selectedYear, setSelectedYear] = useState<number>(2014);
  const [selectedGas, setSelectedGas] = useState<string>("All");
  const [selectedCountry, setSelectedCountry] = useState<string>("All");
  const [isPlayingTimeline, setIsPlayingTimeline] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Hovered Bubble State for World Map
  const [hoveredCountryData, setHoveredCountryData] = useState<CountryRanking | null>(null);

  // Drag-and-Drop & Multi-Country Plotted Lines State
  const [plottedCountries, setPlottedCountries] = useState<string[]>([
    "United States of America",
    "Germany",
  ]);
  const [graphEmissionType, setGraphEmissionType] = useState<string>("CO2");
  const [isDragOverDropZone, setIsDragOverDropZone] = useState<boolean>(false);
  const [hoveredGraphPoint, setHoveredGraphPoint] = useState<{
    country: string;
    year: number;
    value: number;
  } | null>(null);

  // Comparison State
  const [compareCountryA, setCompareCountryA] = useState<string>("United States of America");
  const [compareCountryB, setCompareCountryB] = useState<string>("Germany");

  // Leaderboard Tab
  const [leaderboardTab, setLeaderboardTab] = useState<"top" | "reducers" | "growth">("top");

  // Timeline Auto-Play Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlayingTimeline) {
      interval = setInterval(() => {
        setSelectedYear((prevYear) => {
          if (prevYear >= 2014) {
            setIsPlayingTimeline(false);
            return 1990;
          }
          return prevYear + 1;
        });
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isPlayingTimeline]);

  // Analytical Calculations via dataProcessor.ts
  const globalSummary = useMemo(() => {
    return getGlobalSummary(selectedYear, selectedGas);
  }, [selectedYear, selectedGas]);

  const topEmitters = useMemo(() => {
    return getTopEmitters(selectedYear, selectedGas, 43);
  }, [selectedYear, selectedGas]);

  const gasComposition = useMemo(() => {
    return getGasComposition(selectedYear, selectedCountry);
  }, [selectedYear, selectedCountry]);

  const countryComparison = useMemo(() => {
    return compareTwoCountries(compareCountryA, compareCountryB, selectedGas);
  }, [compareCountryA, compareCountryB, selectedGas]);

  const automatedInsights = useMemo(() => {
    return generateEnvironmentalInsights(selectedYear);
  }, [selectedYear]);

  // Theme Consumption
  const activeGasTheme = getGasTheme(selectedGas);
  const trendTheme = getTrendTheme(globalSummary.yoyPercent);

  // Maximum Country Emission Value in current year for radius scaling
  const maxCountryValue = useMemo(() => {
    return Math.max(...topEmitters.map((e) => e.value), 1);
  }, [topEmitters]);

  const countryDeepStats = useMemo(() => {
    if (selectedCountry === "All" || !selectedCountry) return null;
    return getCountryDeepStats(selectedCountry);
  }, [selectedCountry]);

  // Always-Visible Indicator Badge Info
  const indicatorData = useMemo(() => {
    if (hoveredCountryData) {
      return {
        label: `${hoveredCountryData.country} (${selectedYear})`,
        value: formatEmissionsValue(hoveredCountryData.value),
        share: `${hoveredCountryData.sharePercent.toFixed(1)}% of Global Total`,
        isHovered: true,
      };
    }
    return {
      label: `Global Emissions (${selectedYear})`,
      value: formatEmissionsValue(globalSummary.totalEmissions),
      share: `Total Monitored Scale`,
      isHovered: false,
    };
  }, [hoveredCountryData, selectedYear, globalSummary]);

  // Drag and Drop Handlers
  const addCountryToBar = (countryName: string) => {
    if (!countryName) return;
    if (!plottedCountries.includes(countryName)) {
      setPlottedCountries([...plottedCountries, countryName]);
    }
  };

  const removeCountryFromBar = (countryName: string) => {
    setPlottedCountries(plottedCountries.filter((c) => c !== countryName));
  };

  const handleDragStartBubble = (e: React.DragEvent, countryName: string) => {
    e.dataTransfer.setData("text/plain", countryName);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDropOnBar = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverDropZone(false);
    const countryName = e.dataTransfer.getData("text/plain");
    if (countryName) {
      addCountryToBar(countryName);
    }
  };

  // Multi-Country Graph Timelines & SVG Math
  const plottedTimelines = useMemo(() => {
    return plottedCountries.map((country, index) => {
      const timeline = getEmissionsTimeline(country, graphEmissionType);
      const color = COUNTRY_COLORS[index % COUNTRY_COLORS.length];
      return {
        country,
        timeline,
        color,
      };
    });
  }, [plottedCountries, graphEmissionType]);

  const graphMaxVal = useMemo(() => {
    let max = 1;
    plottedTimelines.forEach((item) => {
      item.timeline.forEach((pt) => {
        if (pt.value > max) max = pt.value;
      });
    });
    return max;
  }, [plottedTimelines]);

  const graphMinVal = useMemo(() => {
    let min = 0;
    plottedTimelines.forEach((item) => {
      item.timeline.forEach((pt) => {
        if (pt.value < min) min = pt.value;
      });
    });
    return min;
  }, [plottedTimelines]);

  const svgGraphWidth = 800;
  const svgGraphHeight = 290;
  const graphPaddingLeft = 75;
  const graphPaddingRight = 30;
  const graphPaddingTop = 25;
  const graphPaddingBottom = 45;

  // Filtered Leaderboard Countries
  const filteredLeaderboard = useMemo(() => {
    let list = [...topEmitters];
    if (searchQuery.trim()) {
      list = list.filter((item) =>
        item.country.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (leaderboardTab === "reducers") {
      return list.sort((a, b) => a.baselineChangePercent - b.baselineChangePercent);
    } else if (leaderboardTab === "growth") {
      return list.sort((a, b) => b.baselineChangePercent - a.baselineChangePercent);
    }
    return list.sort((a, b) => b.value - a.value);
  }, [topEmitters, searchQuery, leaderboardTab]);

  // Export Data Handler
  const handleExportCSV = () => {
    const csvRows = [
      ["Rank", "Country", "Emissions_Kt_CO2e", "Global_Share_Percent", "YoY_Change_Percent", "Baseline_1990_Delta_Percent"],
      ...topEmitters.map((e) => [
        e.rank,
        `"${e.country}"`,
        e.value.toFixed(2),
        e.sharePercent.toFixed(2),
        e.yoyPercent.toFixed(2),
        e.baselineChangePercent.toFixed(2),
      ]),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ghg_emissions_${selectedYear}_${selectedGas}.csv`;
    a.click();
  };

  return (
    <div className={`min-h-screen ${UI_PALETTE.pageBg} selection:bg-emerald-500/30 selection:text-emerald-300`}>
      {/* Dynamic Ambient Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute -top-40 -left-40 w-96 h-96 ${UI_PALETTE.heroGlow}`} />
        <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] bg-gradient-to-l from-violet-600/15 via-cyan-600/15 to-transparent blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-[35rem] h-[35rem] bg-gradient-to-t from-emerald-600/10 via-sky-600/10 to-transparent blur-3xl" />
      </div>

      {/* Top Header Bar */}
      <header className={`sticky top-0 z-50 ${UI_PALETTE.headerBg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950/50">
              <svg className="w-6 h-6 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.5a2.5 2.5 0 002.5-2.5V11.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0L17 9.586V6a2 2 0 00-2-2h-3.343a2 2 0 00-1.414.586L9 6" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-100 tracking-tight flex items-center gap-2">
                EcoMetrics <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-normal">v3.0 Interactive Drag & Plot</span>
              </h1>
              <p className="text-xs text-slate-400">Global Greenhouse Gas Emissions Observatory</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-6 text-xs text-slate-400 border-r border-slate-800 pr-6">
              <div>
                <span className="text-slate-500 block">Dataset Span</span>
                <span className="font-semibold text-slate-200">1990 – 2014</span>
              </div>
              <div>
                <span className="text-slate-500 block">Monitored Nations</span>
                <span className="font-semibold text-slate-200">{AVAILABLE_COUNTRIES.length} Countries</span>
              </div>
              <div>
                <span className="text-slate-500 block">Active Gas</span>
                <span className={`font-semibold ${activeGasTheme.twText}`}>{selectedGas}</span>
              </div>
            </div>

            <button
              onClick={handleExportCSV}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${UI_PALETTE.buttonSecondary} flex items-center gap-1.5`}
            >
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Banner Section */}
        <section className="text-center space-y-4 pt-4 pb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Drag & Drop Country Trajectory Analytics
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Interactive World Map & <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Custom Multi-Country Graph</span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Drag country bubbles directly into the comparison bar below to compare their historical emissions curves over 25 years.
          </p>
        </section>

        {/* Timeline Control Bar & Gas Selection Filters */}
        <section className={`p-5 rounded-2xl ${UI_PALETTE.cardBg} space-y-5 shadow-xl`}>
          {/* Year Scrubber Slider & Auto-Play */}
          <div className="flex flex-col md:flex-row items-center gap-4 justify-between bg-slate-950/60 p-4 rounded-xl border border-slate-800/60">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${isPlayingTimeline
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                  }`}
              >
                {isPlayingTimeline ? (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                    Pause Timeline
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Play Timeline
                  </>
                )}
              </button>
              <div className="text-xs font-semibold text-slate-300">
                Selected Year: <span className="text-emerald-400 text-lg font-bold ml-1">{selectedYear}</span>
              </div>
            </div>

            <div className="flex-1 w-full max-w-2xl px-2">
              <div className="relative flex items-center">
                <input
                  type="range"
                  min={1990}
                  max={2014}
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 focus:outline-none"
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>1990</span>
                <span>1995</span>
                <span>2000</span>
                <span>2005</span>
                <span>2010</span>
                <span>2014</span>
              </div>
            </div>
          </div>

          {/* Gas Filter Pills & Country Selector */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-medium text-slate-400 mr-1">Filter Map Gas:</span>
              {["All", "CO2", "CH4", "N2O", "HFC", "PFC", "SF6"].map((gas) => {
                const gasTheme = getGasTheme(gas);
                const isActive = selectedGas === gas || (gas === "All" && selectedGas === "All");
                return (
                  <button
                    key={gas}
                    onClick={() => setSelectedGas(gas)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${isActive
                      ? `${gasTheme.twBg} ${gasTheme.twText} ${gasTheme.twBorder} border shadow-md`
                      : "bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700"
                      }`}
                  >
                    {gas === "All" ? "All GHG" : gas}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <span className="text-xs font-medium text-slate-400">Map Focus:</span>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${UI_PALETTE.inputBg} cursor-pointer max-w-[200px]`}
              >
                <option value="All">Global (All 43 Nations)</option>
                {AVAILABLE_COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Key Performance Indicators (KPIs) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Total Emissions */}
          <div className={`p-5 rounded-2xl ${UI_PALETTE.cardBg} space-y-3 relative overflow-hidden group`}>
            <div className={`absolute top-0 right-0 w-24 h-24 ${activeGasTheme.twBg} rounded-bl-full blur-xl transition-all group-hover:scale-110`} />
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Total Emissions ({selectedYear})</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${activeGasTheme.twBadge}`}>
                {selectedGas}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {formatEmissionsValue(globalSummary.totalEmissions)}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${trendTheme.twBadge}`}>
                {globalSummary.yoyPercent > 0 ? "+" : ""}
                {globalSummary.yoyPercent.toFixed(2)}%
              </span>
              <span className="text-slate-400 text-[11px]">vs {globalSummary.year - 1}</span>
            </div>
          </div>

          {/* KPI 2: Top Emitter */}
          <div className={`p-5 rounded-2xl ${UI_PALETTE.cardBg} space-y-3 relative overflow-hidden group`}>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Leading Contributor</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                #1 Rank
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight truncate">
              {globalSummary.topEmitter.country}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{formatEmissionsValue(globalSummary.topEmitter.value)}</span>
              <span className="font-semibold text-amber-400">
                {globalSummary.topEmitter.sharePercent.toFixed(1)}% Share
              </span>
            </div>
          </div>

          {/* KPI 3: Baseline 1990 Delta */}
          <div className={`p-5 rounded-2xl ${UI_PALETTE.cardBg} space-y-3 relative overflow-hidden group`}>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>1990 Baseline Shift</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                25-Yr Delta
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {globalSummary.baselineChangePercent > 0 ? "+" : ""}
              {globalSummary.baselineChangePercent.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-400">
              Baseline: <span className="text-slate-200 font-medium">{formatEmissionsValue(globalSummary.baseline1990Total)}</span>
            </div>
          </div>

          {/* KPI 4: Dominant Gas */}
          <div className={`p-5 rounded-2xl ${UI_PALETTE.cardBg} space-y-3 relative overflow-hidden group`}>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Dominant Gas ({selectedYear})</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                Composition
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {gasComposition[0]?.gas || "CO2"}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{gasComposition[0]?.percentage.toFixed(1)}% of footprint</span>
              <span className="text-emerald-400 font-medium">Primary</span>
            </div>
          </div>
        </section>

        {/* WORLD MAP BUBBLE CHART & Gas Composition Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Interactive World Map Card */}
          <div className={`lg:col-span-2 p-6 rounded-2xl ${UI_PALETTE.cardBg} space-y-4 flex flex-col justify-between`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  Global Country Emissions Bubble Map
                  <span className={`text-xs px-2 py-0.5 rounded-full ${activeGasTheme.twBadge}`}>
                    {selectedGas}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  <span className="text-emerald-400 font-semibold">Tip:</span> Drag any bubble to the bar below or click a bubble to compare trajectories!
                </p>
              </div>

              {/* ALWAYS-VISIBLE LIVE YEAR & VALUE INDICATOR BADGE */}
              <div className={`text-right text-xs px-3 py-2 rounded-xl border transition-all duration-300 ${indicatorData.isHovered
                ? "bg-slate-900 border-emerald-500/50 shadow-lg shadow-emerald-950/50"
                : "bg-slate-950/90 border-slate-800"
                }`}>
                <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">{indicatorData.label}</div>
                <div className="text-emerald-400 font-extrabold text-sm sm:text-base">{indicatorData.value}</div>
                <div className="text-slate-500 text-[10px] font-medium">{indicatorData.share}</div>
              </div>
            </div>

            {/* World Map Component */}
            <WorldMap
              selectedYear={selectedYear}
              selectedGas={selectedGas}
              selectedCountry={selectedCountry}
              topEmitters={topEmitters}
              maxCountryValue={maxCountryValue}
              activeGasTheme={activeGasTheme}
              hoveredCountryData={hoveredCountryData}
              onHoverCountry={setHoveredCountryData}
              onSelectCountry={setSelectedCountry}
              onAddCountryToBar={addCountryToBar}
              plottedCountries={plottedCountries}
            />

            {/* Map Legend */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full opacity-60" style={{ backgroundColor: activeGasTheme.hex }} />
                  <span>Country Bubble</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0 -2.5v-6a1.5 1.5 0 1 1 3 0v6m-3 0h3m-3 0h-1.5M17 11.5V14m0 -2.5v-6a1.5 1.5 0 1 0 -3 0v6m3 0h-3m3 0h1.5" />
                  </svg>
                  <span>Drag bubble or click to add</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500">
                Top Emitter ({selectedYear}): <span className="text-slate-200 font-semibold">{globalSummary.topEmitter.country}</span>
              </div>
            </div>
          </div>

          {/* Gas Composition Donut Breakdown & Country Deep Dive */}
          <div className={`p-6 rounded-2xl ${UI_PALETTE.cardBg} space-y-4 flex flex-col justify-between`}>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-100">
                  Gas Breakdown ({selectedYear})
                </h3>
                {selectedCountry !== "All" && (
                  <button
                    onClick={() => setSelectedCountry("All")}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20"
                  >
                    Reset to Global
                  </button>
                )}
              </div>

              {/* Active Scope Badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Target Scope:</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {selectedCountry === "All" ? "Global Scale (43 Nations)" : selectedCountry}
                </span>
              </div>
            </div>

            {/* Country Deep Dive Quick Stats Card (If a country is selected) */}
            {countryDeepStats && (
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">{countryDeepStats.country} Highlights</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      countryDeepStats.netChangePercent <= 0
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                    }`}
                  >
                    {countryDeepStats.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Historical Peak</span>
                    <span className="font-bold text-slate-100">
                      {countryDeepStats.peakYear}: {formatEmissionsValue(countryDeepStats.peakValue)}
                    </span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">1990 Baseline Delta</span>
                    <span
                      className={`font-bold ${
                        countryDeepStats.netChangePercent <= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {countryDeepStats.netChangePercent > 0 ? "+" : ""}
                      {countryDeepStats.netChangePercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Gas Composition Progress Bars */}
            <div className="space-y-3">
              {gasComposition.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  No breakdown data available for this country selection in {selectedYear}.
                </div>
              ) : (
                gasComposition.map((item) => {
                  const itemTheme = getGasTheme(item.gas);
                  return (
                    <div key={item.gas} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-medium">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${itemTheme.twBg} border ${itemTheme.twBorder}`}
                            style={{ backgroundColor: itemTheme.hex }}
                          />
                          <span className="text-slate-200">{item.gas}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-slate-100">{item.percentage.toFixed(1)}%</span>
                          <span className="text-slate-500 text-[10px] ml-1.5">({formatEmissionsValue(item.value)})</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(item.percentage, 2)}%`,
                            backgroundColor: itemTheme.hex,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Key Gas Insight
              </div>
              <p className="text-[11px] leading-relaxed">
                {selectedCountry === "All"
                  ? "CO₂ continues to dominate the global greenhouse footprint, followed by Methane (CH₄) and Nitrous Oxide (N₂O)."
                  : `Showing specific greenhouse gas composition for ${selectedCountry} in year ${selectedYear}.`}
              </p>
            </div>
          </div>
        </section>

        {/* DROP ZONE BAR & MULTI-COUNTRY TRAJECTORY LINE GRAPH */}
        <section className={`p-6 rounded-2xl ${UI_PALETTE.cardBg} space-y-6 shadow-2xl border-emerald-500/20`}>
          {/* DROP ZONE BAR */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  Country Comparison Drop Zone Bar
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-normal">
                    {plottedCountries.length} Countries Selected
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Drag country bubbles from the map above into this bar to plot their emissions trajectories simultaneously!
                </p>
              </div>

              {plottedCountries.length > 0 && (
                <button
                  onClick={() => setPlottedCountries([])}
                  className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Interactive Drag Target Container */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOverDropZone(true);
              }}
              onDragLeave={() => setIsDragOverDropZone(false)}
              onDrop={handleDropOnBar}
              className={`p-4 rounded-xl transition-all duration-300 flex flex-wrap items-center gap-3 min-h-[72px] border-2 ${isDragOverDropZone
                ? "bg-emerald-950/40 border-emerald-400 border-dashed scale-[1.01]"
                : "bg-slate-950/80 border-slate-800 border-dashed"
                }`}
            >
              {plottedCountries.length === 0 ? (
                <div className="w-full text-center py-2 text-xs text-slate-500 flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <span>Drag country bubbles from the map into this bar, or select a country from below</span>
                </div>
              ) : (
                plottedCountries.map((country, index) => {
                  const countryColor = COUNTRY_COLORS[index % COUNTRY_COLORS.length];
                  return (
                    <div
                      key={country}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border text-xs font-bold shadow-md transition-all hover:scale-105"
                      style={{ borderColor: countryColor, color: "#f8fafc" }}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: countryColor }} />
                      <span>{country}</span>
                      {/* X ICON TO ELIMINATE THE COUNTRY */}
                      <button
                        onClick={() => removeCountryFromBar(country)}
                        className="ml-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 p-0.5 rounded-full transition-all"
                        title={`Eliminate ${country}`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })
              )}

              {/* Quick Add Dropdown inside bar */}
              <div className="ml-auto">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      addCountryToBar(e.target.value);
                      e.target.value = "";
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${UI_PALETTE.inputBg} cursor-pointer`}
                >
                  <option value="">+ Add Country...</option>
                  {AVAILABLE_COUNTRIES.map((c) => (
                    <option key={c} value={c} disabled={plottedCountries.includes(c)}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* MULTI-COUNTRY TRAJECTORY LINE GRAPH */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  Emissions Trajectory Comparison Line Graph
                </h4>
                <p className="text-xs text-slate-400">Plotting annual emissions (1990 - 2014) for all countries in the bar above</p>
              </div>

              {/* RIGHT SIDE EMISSION SELECTOR DROPDOWN (CO2 DEFAULT) */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-300">Select Emission Type:</span>
                <select
                  value={graphEmissionType}
                  onChange={(e) => setGraphEmissionType(e.target.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${UI_PALETTE.inputBg} border-emerald-500/40 text-emerald-400`}
                >
                  <option value="CO2">CO₂ Emissions (Default)</option>
                  <option value="CH4">CH₄ Methane Emissions</option>
                  <option value="N2O">N₂O Nitrous Oxide</option>
                  <option value="HFC">HFC Hydrofluorocarbons</option>
                  <option value="PFC">PFC Perfluorocarbons</option>
                  <option value="SF6">SF₆ Sulfur Hexafluoride</option>
                  <option value="GHG">All GHG Combined</option>
                </select>
              </div>
            </div>

            {/* SVG MULTI-LINE CHART CANVAS */}
            <div className="relative w-full overflow-hidden bg-slate-950/90 rounded-xl border border-slate-800/80 p-4">
              {plottedCountries.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs font-medium">
                  No countries added to the bar. Drag a country bubble or select a country to visualize lines.
                </div>
              ) : (
                <svg viewBox={`0 0 ${svgGraphWidth} ${svgGraphHeight}`} className="w-full h-auto overflow-visible select-none">
                  {/* Axis Border Boundary Lines */}
                  <line
                    x1={graphPaddingLeft}
                    y1={graphPaddingTop}
                    x2={graphPaddingLeft}
                    y2={svgGraphHeight - graphPaddingBottom}
                    stroke="#475569"
                    strokeWidth="1.5"
                  />
                  <line
                    x1={graphPaddingLeft}
                    y1={svgGraphHeight - graphPaddingBottom}
                    x2={svgGraphWidth - graphPaddingRight}
                    y2={svgGraphHeight - graphPaddingBottom}
                    stroke="#475569"
                    strokeWidth="1.5"
                  />

                  {/* Y-AXIS UNIT TITLE */}
                  <text
                    x="18"
                    y={(graphPaddingTop + (svgGraphHeight - graphPaddingBottom)) / 2}
                    fill="#94a3b8"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                    transform={`rotate(-90, 18, ${(graphPaddingTop + (svgGraphHeight - graphPaddingBottom)) / 2})`}
                    className="font-sans"
                  >
                    Volume (T CO₂e)
                  </text>

                  {/* X-AXIS UNIT TITLE */}
                  <text
                    x={(graphPaddingLeft + (svgGraphWidth - graphPaddingRight)) / 2}
                    y={svgGraphHeight - 6}
                    fill="#94a3b8"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="font-sans"
                  >
                    Years
                  </text>

                  {/* Horizontal Grid Lines & Y-Axis Labels */}
                  {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                    const y = svgGraphHeight - graphPaddingBottom - pct * (svgGraphHeight - graphPaddingTop - graphPaddingBottom);
                    const val = graphMinVal + pct * (graphMaxVal - graphMinVal);
                    return (
                      <g key={`graph-grid-${i}`}>
                        <line
                          x1={graphPaddingLeft}
                          y1={y}
                          x2={svgGraphWidth - graphPaddingRight}
                          y2={y}
                          stroke="#1e293b"
                          strokeDasharray="3 3"
                          strokeWidth="1"
                        />
                        <text
                          x={graphPaddingLeft - 10}
                          y={y + 3}
                          fill="#64748b"
                          fontSize="9"
                          textAnchor="end"
                          className="font-mono"
                        >
                          {(val / 1000).toFixed(0)}k
                        </text>
                      </g>
                    );
                  })}

                  {/* Year X-Axis Ticks */}
                  {AVAILABLE_YEARS.map((yr, idx) => {
                    if (idx % 3 !== 0 && idx !== AVAILABLE_YEARS.length - 1) return null;
                    const x = graphPaddingLeft + (idx / (AVAILABLE_YEARS.length - 1)) * (svgGraphWidth - graphPaddingLeft - graphPaddingRight);
                    return (
                      <g key={`year-tick-${yr}`}>
                        <line
                          x1={x}
                          y1={svgGraphHeight - graphPaddingBottom}
                          x2={x}
                          y2={svgGraphHeight - graphPaddingBottom + 5}
                          stroke="#334155"
                          strokeWidth="1"
                        />
                        <text
                          x={x}
                          y={svgGraphHeight - graphPaddingBottom + 16}
                          fill="#94a3b8"
                          fontSize="9"
                          textAnchor="middle"
                          className="font-mono"
                        >
                          {yr}
                        </text>
                      </g>
                    );
                  })}

                  {/* Country Trajectory Lines */}
                  {plottedTimelines.map((item) => {
                    const rangeY = graphMaxVal - graphMinVal || 1;
                    const pts = item.timeline.map((d, index) => {
                      const x = graphPaddingLeft + (index / (item.timeline.length - 1)) * (svgGraphWidth - graphPaddingLeft - graphPaddingRight);
                      const y = svgGraphHeight - graphPaddingBottom - ((d.value - graphMinVal) / rangeY) * (svgGraphHeight - graphPaddingTop - graphPaddingBottom);
                      return { x, y, year: d.year, value: d.value };
                    });

                    const pathString = pts.reduce((acc, p, i) => {
                      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
                    }, "");

                    return (
                      <g key={`line-group-${item.country}`}>
                        {/* Line Path */}
                        <path
                          d={pathString}
                          fill="none"
                          stroke={item.color}
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="transition-all duration-300 hover:stroke-width-[4]"
                        />

                        {/* Interactive Data Points */}
                        {pts.map((p) => {
                          const isHovered = hoveredGraphPoint?.country === item.country && hoveredGraphPoint?.year === p.year;
                          return (
                            <circle
                              key={`pt-${item.country}-${p.year}`}
                              cx={p.x}
                              cy={p.y}
                              r={isHovered ? "6" : "3.5"}
                              fill={item.color}
                              stroke="#020617"
                              strokeWidth="1.5"
                              className="cursor-pointer transition-all"
                              onMouseEnter={() =>
                                setHoveredGraphPoint({
                                  country: item.country,
                                  year: p.year,
                                  value: p.value,
                                })
                              }
                              onMouseLeave={() => setHoveredGraphPoint(null)}
                            />
                          );
                        })}
                      </g>
                    );
                  })}
                </svg>
              )}

              {/* Hover Tooltip inside Graph */}
              {hoveredGraphPoint && (
                <div className="absolute top-4 right-4 bg-slate-900/95 p-2.5 rounded-xl border border-slate-700 shadow-lg text-xs space-y-0.5 backdrop-blur-md pointer-events-none">
                  <div className="font-bold text-slate-100">{hoveredGraphPoint.country}</div>
                  <div className="text-emerald-400 font-mono font-extrabold">
                    {hoveredGraphPoint.year}: {formatEmissionsValue(hoveredGraphPoint.value)}
                  </div>
                  <div className="text-slate-400 text-[10px]">Type: {graphEmissionType}</div>
                </div>
              )}
            </div>

            {/* COLOR LEGEND */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Graph Legend:</span>
                {plottedTimelines.map((item) => (
                  <div key={`legend-${item.country}`} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-medium">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-200">{item.country}</span>
                    <button
                      onClick={() => removeCountryFromBar(item.country)}
                      className="ml-1 text-slate-500 hover:text-rose-400"
                      title="Remove from graph"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="text-xs text-slate-500 font-mono">
                Plotted Gas: <span className="text-emerald-400 font-bold">{graphEmissionType}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Automated Climate Insights Engine */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              Automated Climate Analytics & Insights
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20">
                AI Engine
              </span>
            </h3>
            <span className="text-xs text-slate-400">Calculated dynamically from dataset</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {automatedInsights.map((insight) => {
              let borderColor = "border-slate-800";
              let badgeColor = "bg-slate-800 text-slate-300";
              if (insight.type === "success") {
                borderColor = "border-emerald-500/30";
                badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
              } else if (insight.type === "warning") {
                borderColor = "border-rose-500/30";
                badgeColor = "bg-rose-500/10 text-rose-400 border-rose-500/30";
              } else if (insight.type === "highlight") {
                borderColor = "border-amber-500/30";
                badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/30";
              } else if (insight.type === "info") {
                borderColor = "border-cyan-500/30";
                badgeColor = "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
              }

              return (
                <div key={insight.id} className={`p-4 rounded-xl ${UI_PALETTE.cardBg} border ${borderColor} space-y-2`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badgeColor}`}>
                      {insight.metric || "Insight"}
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm text-slate-100">{insight.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{insight.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Country Leaderboard & Ranking Matrix */}
        <section className={`p-6 rounded-2xl ${UI_PALETTE.cardBg} space-y-5 shadow-xl`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-100">Country Emissions Leaderboard ({selectedYear})</h3>
              <p className="text-xs text-slate-400">Rankings, global shares, YoY trends, and 1990 baseline deltas for all 43 nations</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* Tab Toggles */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setLeaderboardTab("top")}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${leaderboardTab === "top" ? "bg-emerald-500/20 text-emerald-300 font-semibold" : "text-slate-400 hover:text-slate-200"
                    }`}
                >
                  Highest Emitters
                </button>
                <button
                  onClick={() => setLeaderboardTab("reducers")}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${leaderboardTab === "reducers" ? "bg-emerald-500/20 text-emerald-300 font-semibold" : "text-slate-400 hover:text-slate-200"
                    }`}
                >
                  Top Reducers
                </button>
                <button
                  onClick={() => setLeaderboardTab("growth")}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${leaderboardTab === "growth" ? "bg-emerald-500/20 text-emerald-300 font-semibold" : "text-slate-400 hover:text-slate-200"
                    }`}
                >
                  Highest Growth
                </button>
              </div>

              {/* Search Bar */}
              <input
                type="text"
                placeholder="Search country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`px-3 py-1.5 rounded-xl text-xs ${UI_PALETTE.inputBg} w-full sm:w-48`}
              />
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/60">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Country</th>
                  <th className="py-3 px-4">Emissions (Kt CO₂e)</th>
                  <th className="py-3 px-4">Global Share</th>
                  <th className="py-3 px-4">YoY Change</th>
                  <th className="py-3 px-4">1990 Baseline Delta</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLeaderboard.slice(0, 15).map((item) => {
                  const yoyTrend = getTrendTheme(item.yoyPercent);
                  const baseTrend = getTrendTheme(item.baselineChangePercent);
                  const isSelected = selectedCountry === item.country;

                  return (
                    <tr
                      key={item.country}
                      className={`hover:bg-slate-900/80 transition-colors ${isSelected ? "bg-emerald-950/30" : ""}`}
                    >
                      <td className="py-3 px-4 font-mono text-slate-400">#{item.rank}</td>
                      <td className="py-3 px-4 font-semibold text-slate-100 flex items-center gap-2">
                        {item.country}
                        {item.rank === 1 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">Top</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-200">
                        {formatEmissionsValue(item.value)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${Math.min(item.sharePercent * 2, 100)}%` }} />
                          </div>
                          <span className="font-medium text-slate-300">{item.sharePercent.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${yoyTrend.twBadge}`}>
                          {item.yoyPercent > 0 ? "+" : ""}
                          {item.yoyPercent.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${baseTrend.twBadge}`}>
                          {item.baselineChangePercent > 0 ? "+" : ""}
                          {item.baselineChangePercent.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            addCountryToBar(item.country);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 text-xs text-emerald-400 hover:bg-slate-700 font-medium transition-all"
                        >
                          + Add to Graph
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Country vs Country Side-by-Side Comparison Inspector */}
        <section className={`p-6 rounded-2xl ${UI_PALETTE.cardBg} space-y-6 shadow-xl`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Bilateral Country Comparator
                <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 text-xs border border-violet-500/20">
                  Side-by-Side Analysis
                </span>
              </h3>
              <p className="text-xs text-slate-400">Compare emissions trajectory, peak values, and reduction speeds between any two nations</p>
            </div>

            {/* Selectors */}
            <div className="flex items-center gap-3">
              <select
                value={compareCountryA}
                onChange={(e) => setCompareCountryA(e.target.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${UI_PALETTE.inputBg}`}
              >
                {AVAILABLE_COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <span className="text-xs font-bold text-slate-500">VS</span>
              <select
                value={compareCountryB}
                onChange={(e) => setCompareCountryB(e.target.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${UI_PALETTE.inputBg}`}
              >
                {AVAILABLE_COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Comparison Cards & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="text-xs text-slate-400">Emissions Ratio (2014)</div>
              <div className="text-2xl font-extrabold text-slate-100">
                {countryComparison.ratio.toFixed(2)}x
              </div>
              <p className="text-xs text-slate-400">
                <span className="text-emerald-400 font-semibold">{countryComparison.countryA}</span> emitted {countryComparison.ratio.toFixed(2)} times the volume of <span className="text-violet-400 font-semibold">{countryComparison.countryB}</span> in 2014.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="text-xs text-slate-400">Decarbonization Leader</div>
              <div className="text-xl font-bold text-emerald-400 truncate">
                {countryComparison.reductionLeader}
              </div>
              <p className="text-xs text-slate-400">
                Achieved a faster net reduction relative to its 1990 baseline.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="text-xs text-slate-400">Larger Absolute Footprint</div>
              <div className="text-xl font-bold text-amber-400 truncate">
                {countryComparison.winner2014}
              </div>
              <p className="text-xs text-slate-400">
                Highest absolute tonnage recorded in 2014.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-800/80 bg-slate-950 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 space-y-2">
          <p className="text-slate-400">
            EcoMetrics Climate Data Platform • Greenhouse Gas Visualization Project
          </p>
          <p>
            Units displayed in <span className="text-slate-300 font-medium">Kilotonnes CO₂ Equivalent (Kt CO₂e)</span> • Covering 43 Nations from 1990 to 2014
          </p>
        </div>
      </footer>
    </div>
  );
}
