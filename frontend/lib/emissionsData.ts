// Dynamic CSV loading module for emissions dataset

export interface CountryEmissionRecord {
  country: string;
  year: number;
  value: number;
  units: string;
}

export interface TotalEmissionRecord {
  emission: string;
  year: number;
  value: number;
  units: string;
}

export interface DetailedEmissionRecord {
  country: string;
  year: number;
  value: number;
  emission: string;
  units: string;
}

export const AVAILABLE_COUNTRIES: string[] = [
  "Australia", "Austria", "Belarus", "Belgium", "Bulgaria", "Canada", "Croatia", 
  "Cyprus", "Czech Republic", "Denmark", "Estonia", "European Union", "Finland", 
  "France", "Germany", "Greece", "Hungary", "Iceland", "Ireland", "Italy", 
  "Japan", "Latvia", "Liechtenstein", "Lithuania", "Luxembourg", "Malta", 
  "Monaco", "Netherlands", "New Zealand", "Norway", "Poland", "Portugal", 
  "Romania", "Russian Federation", "Slovakia", "Slovenia", "Spain", "Sweden", 
  "Switzerland", "Turkey", "Ukraine", "United Kingdom", "United States of America"
];

export const AVAILABLE_YEARS: number[] = [
  1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 
  2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014
];

export const AVAILABLE_GASES: string[] = [
  "CH4 Emissions", "CO2 Emissions", "GHG Emissions", "GHG Emissions with CO2", 
  "HFC Emissions", "N2O Emissions", "NF3 Emissions", "PFC Emissions", 
  "SF6 Emissions", "Unspecified Emissions"
];

// Memory store for loaded dataset
let countryEmissionsCache: CountryEmissionRecord[] = [];
let totalEmissionsCache: TotalEmissionRecord[] = [];
let detailedEmissionsCache: DetailedEmissionRecord[] = [];
let isLoaded = false;
let loadPromise: Promise<boolean> | null = null;

/**
 * Fast, lightweight CSV parser for clean tabular datasets
 */
function parseCSV<T>(csvText: string, mapFn: (cols: string[]) => T): T[] {
  const lines = csvText.trim().split(/\r?\n/);
  const results: T[] = [];
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(",");
    results.push(mapFn(cols));
  }
  return results;
}

/**
 * Load emissions datasets asynchronously from public/data/ CSV files
 */
export async function loadEmissionsData(): Promise<boolean> {
  if (isLoaded) return true;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const [countryRes, totalRes, dataRes] = await Promise.all([
        fetch("/data/country_emissions.csv"),
        fetch("/data/total_emissions.csv"),
        fetch("/data/data.csv"),
      ]);

      const [countryText, totalText, dataText] = await Promise.all([
        countryRes.text(),
        totalRes.text(),
        dataRes.text(),
      ]);

      countryEmissionsCache = parseCSV<CountryEmissionRecord>(countryText, (cols) => ({
        country: cols[0],
        year: parseInt(cols[1], 10),
        value: parseFloat(cols[2]),
        units: cols[3] || "Kilotonne CO2 Equivalent",
      }));

      totalEmissionsCache = parseCSV<TotalEmissionRecord>(totalText, (cols) => ({
        emission: cols[0],
        year: parseInt(cols[1], 10),
        value: parseFloat(cols[2]),
        units: cols[3] || "Kilotonne CO2 Equivalent",
      }));

      detailedEmissionsCache = parseCSV<DetailedEmissionRecord>(dataText, (cols) => ({
        country: cols[0],
        year: parseInt(cols[1], 10),
        value: parseFloat(cols[2]),
        emission: cols[3],
        units: cols[4] || "Kilotonne CO2 Equivalent",
      }));

      isLoaded = true;
      return true;
    } catch (err) {
      console.error("Failed to load emissions CSV data:", err);
      return false;
    }
  })();

  return loadPromise;
}

export function isEmissionsDataLoaded(): boolean {
  return isLoaded;
}

export function getCountryEmissions(): CountryEmissionRecord[] {
  return countryEmissionsCache;
}

export function getTotalEmissionsByGas(): TotalEmissionRecord[] {
  return totalEmissionsCache;
}

export function getDetailedEmissions(): DetailedEmissionRecord[] {
  return detailedEmissionsCache;
}

// Backward compatibility exports (read from cache)
export const COUNTRY_EMISSIONS = countryEmissionsCache;
export const TOTAL_EMISSIONS_BY_GAS = totalEmissionsCache;
export const DETAILED_EMISSIONS = detailedEmissionsCache;
