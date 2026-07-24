/**
 * Data Processing Engine for Greenhouse Gas Emissions
 * Performs analytical calculations, statistical aggregations, YoY growth metrics,
 * rankings, gas composition breakdowns, and comparative analytics.
 */

import {
  COUNTRY_EMISSIONS,
  TOTAL_EMISSIONS_BY_GAS,
  DETAILED_EMISSIONS,
  AVAILABLE_COUNTRIES,
  AVAILABLE_YEARS,
  AVAILABLE_GASES,
  CountryEmissionRecord,
  TotalEmissionRecord,
  DetailedEmissionRecord,
} from "./emissionsData";

export interface GlobalSummary {
  year: number;
  totalEmissions: number;
  previousYearTotal: number;
  yoyDelta: number;
  yoyPercent: number;
  baseline1990Total: number;
  baselineChangePercent: number;
  topEmitter: { country: string; value: number; sharePercent: number };
  activeGasFilter: string;
}

export interface CountryRanking {
  rank: number;
  country: string;
  value: number;
  sharePercent: number;
  yoyPercent: number;
  baseline1990Value: number;
  baselineChangePercent: number;
}

export interface GasCompositionItem {
  gas: string;
  value: number;
  percentage: number;
}

export interface TimelinePoint {
  year: number;
  value: number;
  [key: string]: number | string;
}

export interface CountryDeepStats {
  country: string;
  peakYear: number;
  peakValue: number;
  minYear: number;
  minValue: number;
  averageValue: number;
  baseline1990Value: number;
  latest2014Value: number;
  netChangePercent: number;
  cagr: number;
  status: "drastic_reduction" | "moderate_reduction" | "stable" | "increasing";
}

export interface CountryComparisonResult {
  countryA: string;
  countryB: string;
  ratio: number; // countryA / countryB
  timeline: { year: number; valA: number; valB: number; diff: number }[];
  winner2014: string;
  reductionLeader: string;
}

export interface InsightAlert {
  id: string;
  type: "success" | "warning" | "info" | "highlight";
  title: string;
  description: string;
  metric?: string;
}

/**
 * Filter detailed emissions by country and gas
 */
function filterDetailed(countryFilter?: string, gasFilter?: string): DetailedEmissionRecord[] {
  let records = DETAILED_EMISSIONS;
  if (countryFilter && countryFilter !== "All") {
    records = records.filter((r) => r.country.toLowerCase() === countryFilter.toLowerCase());
  }
  if (gasFilter && gasFilter !== "All" && gasFilter !== "GHG Emissions") {
    records = records.filter((r) => r.emission.toLowerCase().includes(gasFilter.toLowerCase()));
  }
  return records;
}

/**
 * Filter country total emissions
 */
function filterCountryTotals(countryFilter?: string): CountryEmissionRecord[] {
  if (countryFilter && countryFilter !== "All") {
    return COUNTRY_EMISSIONS.filter(
      (r) => r.country.toLowerCase() === countryFilter.toLowerCase()
    );
  }
  return COUNTRY_EMISSIONS;
}

/**
 * Compute Global Summary for a specific year
 */
export function getGlobalSummary(selectedYear: number, gasFilter: string = "All"): GlobalSummary {
  let currentTotal = 0;
  let prevTotal = 0;
  let baselineTotal = 0;

  const currentYear = selectedYear;
  const prevYear = Math.max(1990, selectedYear - 1);

  if (gasFilter === "All" || gasFilter === "GHG Emissions") {
    const curRecords = COUNTRY_EMISSIONS.filter((r) => r.year === currentYear);
    const prevRecords = COUNTRY_EMISSIONS.filter((r) => r.year === prevYear);
    const baseRecords = COUNTRY_EMISSIONS.filter((r) => r.year === 1990);

    currentTotal = curRecords.reduce((acc, r) => acc + r.value, 0);
    prevTotal = prevRecords.reduce((acc, r) => acc + r.value, 0);
    baselineTotal = baseRecords.reduce((acc, r) => acc + r.value, 0);
  } else {
    const curRecords = filterDetailed(undefined, gasFilter).filter((r) => r.year === currentYear);
    const prevRecords = filterDetailed(undefined, gasFilter).filter((r) => r.year === prevYear);
    const baseRecords = filterDetailed(undefined, gasFilter).filter((r) => r.year === 1990);

    currentTotal = curRecords.reduce((acc, r) => acc + r.value, 0);
    prevTotal = prevRecords.reduce((acc, r) => acc + r.value, 0);
    baselineTotal = baseRecords.reduce((acc, r) => acc + r.value, 0);
  }

  const yoyDelta = currentTotal - prevTotal;
  const yoyPercent = prevTotal > 0 ? (yoyDelta / prevTotal) * 100 : 0;
  const baselineChangePercent = baselineTotal > 0 ? ((currentTotal - baselineTotal) / baselineTotal) * 100 : 0;

  // Find top emitter
  const rankings = getTopEmitters(currentYear, gasFilter, 1);
  const topEmitter = rankings[0]
    ? { country: rankings[0].country, value: rankings[0].value, sharePercent: rankings[0].sharePercent }
    : { country: "N/A", value: 0, sharePercent: 0 };

  return {
    year: currentYear,
    totalEmissions: currentTotal,
    previousYearTotal: prevTotal,
    yoyDelta,
    yoyPercent,
    baseline1990Total: baselineTotal,
    baselineChangePercent,
    topEmitter,
    activeGasFilter: gasFilter,
  };
}

/**
 * Get top emitting countries ranked for a specific year
 */
export function getTopEmitters(
  year: number,
  gasFilter: string = "All",
  limit: number = 10
): CountryRanking[] {
  let countryMap: Record<string, { current: number; prev: number; base: number }> = {};

  const prevYear = Math.max(1990, year - 1);

  if (gasFilter === "All" || gasFilter === "GHG Emissions") {
    COUNTRY_EMISSIONS.forEach((r) => {
      if (!countryMap[r.country]) {
        countryMap[r.country] = { current: 0, prev: 0, base: 0 };
      }
      if (r.year === year) countryMap[r.country].current += r.value;
      if (r.year === prevYear) countryMap[r.country].prev += r.value;
      if (r.year === 1990) countryMap[r.country].base += r.value;
    });
  } else {
    const detailed = filterDetailed(undefined, gasFilter);
    detailed.forEach((r) => {
      if (!countryMap[r.country]) {
        countryMap[r.country] = { current: 0, prev: 0, base: 0 };
      }
      if (r.year === year) countryMap[r.country].current += r.value;
      if (r.year === prevYear) countryMap[r.country].prev += r.value;
      if (r.year === 1990) countryMap[r.country].base += r.value;
    });
  }

  const grandTotal = Object.values(countryMap).reduce((acc, c) => acc + c.current, 0);

  const sorted = Object.entries(countryMap)
    .map(([country, data]) => {
      const sharePercent = grandTotal > 0 ? (data.current / grandTotal) * 100 : 0;
      const yoyPercent = data.prev > 0 ? ((data.current - data.prev) / data.prev) * 100 : 0;
      const baselineChangePercent = data.base > 0 ? ((data.current - data.base) / data.base) * 100 : 0;

      return {
        rank: 0,
        country,
        value: data.current,
        sharePercent,
        yoyPercent,
        baseline1990Value: data.base,
        baselineChangePercent,
      };
    })
    .sort((a, b) => b.value - a.value);

  return sorted.slice(0, limit).map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}

/**
 * Get gas composition breakdown for a selected year and optional country filter
 */
export function getGasComposition(year: number, countryFilter?: string): GasCompositionItem[] {
  let records = DETAILED_EMISSIONS.filter((r) => r.year === year);
  if (countryFilter && countryFilter !== "All") {
    records = records.filter((r) => r.country.toLowerCase() === countryFilter.toLowerCase());
  }

  const totalsByGas: Record<string, number> = {};
  records.forEach((r) => {
    // Exclude aggregated total records to avoid double counting
    if (r.emission !== "GHG Emissions" && r.emission !== "GHG Emissions with CO2") {
      const cleanGas = r.emission.replace(" Emissions", "");
      totalsByGas[cleanGas] = (totalsByGas[cleanGas] || 0) + r.value;
    }
  });

  const grandTotal = Object.values(totalsByGas).reduce((acc, val) => acc + val, 0);

  return Object.entries(totalsByGas)
    .map(([gas, value]) => ({
      gas,
      value,
      percentage: grandTotal > 0 ? (value / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Get emissions timeline series over all available years (1990 - 2014)
 */
export function getEmissionsTimeline(
  countryFilter: string = "All",
  gasFilter: string = "All"
): TimelinePoint[] {
  const result: Record<number, number> = {};
  AVAILABLE_YEARS.forEach((y) => (result[y] = 0));

  if ((countryFilter === "All" || !countryFilter) && (gasFilter === "All" || gasFilter === "GHG Emissions")) {
    COUNTRY_EMISSIONS.forEach((r) => {
      if (result[r.year] !== undefined) {
        result[r.year] += r.value;
      }
    });
  } else if (countryFilter !== "All" && (gasFilter === "All" || gasFilter === "GHG Emissions")) {
    const countryData = COUNTRY_EMISSIONS.filter(
      (r) => r.country.toLowerCase() === countryFilter.toLowerCase()
    );
    countryData.forEach((r) => {
      if (result[r.year] !== undefined) {
        result[r.year] += r.value;
      }
    });
  } else {
    const detailed = filterDetailed(countryFilter, gasFilter);
    detailed.forEach((r) => {
      if (result[r.year] !== undefined) {
        result[r.year] += r.value;
      }
    });
  }

  return AVAILABLE_YEARS.map((year) => ({
    year,
    value: Math.round(result[year] * 100) / 100,
  }));
}

/**
 * Get detailed statistical metrics for a single country
 */
export function getCountryDeepStats(countryName: string): CountryDeepStats | null {
  const records = COUNTRY_EMISSIONS.filter(
    (r) => r.country.toLowerCase() === countryName.toLowerCase()
  );
  if (records.length === 0) return null;

  const sortedByYear = [...records].sort((a, b) => a.year - b.year);
  const baseline = sortedByYear.find((r) => r.year === 1990)?.value || sortedByYear[0].value;
  const latest = sortedByYear.find((r) => r.year === 2014)?.value || sortedByYear[sortedByYear.length - 1].value;

  let peakYear = sortedByYear[0].year;
  let peakValue = sortedByYear[0].value;
  let minYear = sortedByYear[0].year;
  let minValue = sortedByYear[0].value;
  let totalSum = 0;

  sortedByYear.forEach((r) => {
    totalSum += r.value;
    if (r.value > peakValue) {
      peakValue = r.value;
      peakYear = r.year;
    }
    if (r.value < minValue) {
      minValue = r.value;
      minYear = r.year;
    }
  });

  const averageValue = totalSum / sortedByYear.length;
  const netChangePercent = baseline > 0 ? ((latest - baseline) / baseline) * 100 : 0;

  // CAGR calculation: (Latest / Baseline) ^ (1/n) - 1
  const yearsSpan = 2014 - 1990;
  const cagr = baseline > 0 && latest > 0 ? (Math.pow(latest / baseline, 1 / yearsSpan) - 1) * 100 : 0;

  let status: CountryDeepStats["status"] = "stable";
  if (netChangePercent <= -25) status = "drastic_reduction";
  else if (netChangePercent < -5) status = "moderate_reduction";
  else if (netChangePercent > 5) status = "increasing";

  return {
    country: countryName,
    peakYear,
    peakValue,
    minYear,
    minValue,
    averageValue,
    baseline1990Value: baseline,
    latest2014Value: latest,
    netChangePercent,
    cagr,
    status,
  };
}

/**
 * Compare two countries side-by-side
 */
export function compareTwoCountries(
  countryA: string,
  countryB: string,
  gasFilter: string = "All"
): CountryComparisonResult {
  const timelineA = getEmissionsTimeline(countryA, gasFilter);
  const timelineB = getEmissionsTimeline(countryB, gasFilter);

  const combinedTimeline = AVAILABLE_YEARS.map((year) => {
    const valA = timelineA.find((t) => t.year === year)?.value || 0;
    const valB = timelineB.find((t) => t.year === year)?.value || 0;
    return {
      year,
      valA,
      valB,
      diff: valA - valB,
    };
  });

  const latestA = combinedTimeline.find((t) => t.year === 2014)?.valA || 1;
  const latestB = combinedTimeline.find((t) => t.year === 2014)?.valB || 1;

  const statsA = getCountryDeepStats(countryA);
  const statsB = getCountryDeepStats(countryB);

  const reductionA = statsA ? statsA.netChangePercent : 0;
  const reductionB = statsB ? statsB.netChangePercent : 0;

  return {
    countryA,
    countryB,
    ratio: latestB > 0 ? latestA / latestB : 1,
    timeline: combinedTimeline,
    winner2014: latestA > latestB ? countryA : countryB,
    reductionLeader: reductionA < reductionB ? countryA : countryB,
  };
}

/**
 * Generate automated analytical insights for selected year
 */
export function generateEnvironmentalInsights(selectedYear: number): InsightAlert[] {
  const summary = getGlobalSummary(selectedYear);
  const rankings = getTopEmitters(selectedYear, "All", 10);
  const composition = getGasComposition(selectedYear);

  const insights: InsightAlert[] = [];

  // Insight 1: Global Footprint & YoY Trend
  const trendDirection = summary.yoyPercent <= 0 ? "decreased" : "increased";
  const trendAbs = Math.abs(summary.yoyPercent).toFixed(2);
  insights.push({
    id: "global-trend",
    type: summary.yoyPercent <= 0 ? "success" : "warning",
    title: `Global Emissions ${summary.yoyPercent <= 0 ? "Reduction" : "Surge"} (${selectedYear})`,
    description: `Total recorded greenhouse emissions ${trendDirection} by ${trendAbs}% compared to ${summary.year - 1}, reaching ${(summary.totalEmissions / 1000).toFixed(1)}M Kilotonnes CO₂e.`,
    metric: `${summary.yoyPercent > 0 ? "+" : ""}${summary.yoyPercent.toFixed(1)}% YoY`,
  });

  // Insight 2: Dominant Emitter
  if (rankings.length > 0) {
    const top = rankings[0];
    insights.push({
      id: "top-emitter",
      type: "highlight",
      title: `Top Global Contributor: ${top.country}`,
      description: `${top.country} accounted for ${top.sharePercent.toFixed(1)}% of all monitored emissions in ${selectedYear} with ${(top.value / 1000).toFixed(1)}M Kt CO₂e.`,
      metric: `${top.sharePercent.toFixed(1)}% Share`,
    });
  }

  // Insight 3: Dominant Gas Composition
  if (composition.length > 0) {
    const mainGas = composition[0];
    insights.push({
      id: "dominant-gas",
      type: "info",
      title: `Dominant Gas: ${mainGas.gas}`,
      description: `${mainGas.gas} constitutes ${mainGas.percentage.toFixed(1)}% of total atmospheric greenhouse gases analyzed.`,
      metric: `${mainGas.percentage.toFixed(1)}% Composition`,
    });
  }

  // Insight 4: Significant Reducer Country
  const biggestReducer = [...rankings].sort((a, b) => a.baselineChangePercent - b.baselineChangePercent)[0];
  if (biggestReducer && biggestReducer.baselineChangePercent < 0) {
    insights.push({
      id: "biggest-reducer",
      type: "success",
      title: `Decarbonization Champion: ${biggestReducer.country}`,
      description: `${biggestReducer.country} has reduced its emissions by ${Math.abs(biggestReducer.baselineChangePercent).toFixed(1)}% relative to the 1990 baseline.`,
      metric: `${biggestReducer.baselineChangePercent.toFixed(1)}% vs 1990`,
    });
  }

  return insights;
}

export function formatEmissionsValue(val: number): string {
  if (val >= 1000000) return `${(val / 1000000).toFixed(2)}B Kt`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}M Kt`;
  return `${val.toFixed(0)} Kt`;
}
