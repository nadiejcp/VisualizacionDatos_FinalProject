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

// Exported mutable dataset collections
export const COUNTRY_EMISSIONS: CountryEmissionRecord[] = [];
export const TOTAL_EMISSIONS_BY_GAS: TotalEmissionRecord[] = [];
export const DETAILED_EMISSIONS: DetailedEmissionRecord[] = [];

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
      const dataRes = await fetch("/data/data.csv");
      if (!dataRes.ok) {
        throw new Error(`Failed to fetch /data/data.csv (HTTP ${dataRes.status})`);
      }
      const dataText = await dataRes.text();

      let countryText = "";
      let totalText = "";

      try {
        const countryRes = await fetch("/data/country_emissions.csv");
        if (countryRes.ok) countryText = await countryRes.text();
      } catch (e) {
        console.warn("country_emissions.csv fetch skipped/failed, will derive if needed", e);
      }

      try {
        const totalRes = await fetch("/data/total_emissions.csv");
        if (totalRes.ok) totalText = await totalRes.text();
      } catch (e) {
        console.warn("total_emissions.csv fetch skipped/failed, will derive if needed", e);
      }

      const parsedDetailed = parseCSV<DetailedEmissionRecord>(dataText, (cols) => ({
        country: cols[0],
        year: parseInt(cols[1], 10),
        value: parseFloat(cols[2]),
        emission: cols[3],
        units: cols[4] || "Kilotonne CO2 Equivalent",
      })).filter((r) => r.country && !isNaN(r.year) && !isNaN(r.value));

      DETAILED_EMISSIONS.length = 0;
      DETAILED_EMISSIONS.push(...parsedDetailed);

      if (countryText.trim()) {
        const parsedCountry = parseCSV<CountryEmissionRecord>(countryText, (cols) => ({
          country: cols[0],
          year: parseInt(cols[1], 10),
          value: parseFloat(cols[2]),
          units: cols[3] || "Kilotonne CO2 Equivalent",
        })).filter((r) => r.country && !isNaN(r.year) && !isNaN(r.value));

        COUNTRY_EMISSIONS.length = 0;
        COUNTRY_EMISSIONS.push(...parsedCountry);
      } else {
        // Derive COUNTRY_EMISSIONS from DETAILED_EMISSIONS
        const ghgRecords = DETAILED_EMISSIONS.filter(
          (r) => r.emission === "GHG Emissions" || r.emission === "GHG Emissions with CO2"
        );
        const map = new Map<string, CountryEmissionRecord>();
        const targetRecords = ghgRecords.length > 0 ? ghgRecords : DETAILED_EMISSIONS;

        targetRecords.forEach((r) => {
          const key = `${r.country}_${r.year}`;
          const existing = map.get(key);
          if (existing) {
            existing.value += r.value;
          } else {
            map.set(key, {
              country: r.country,
              year: r.year,
              value: r.value,
              units: r.units,
            });
          }
        });

        COUNTRY_EMISSIONS.length = 0;
        COUNTRY_EMISSIONS.push(...Array.from(map.values()));
      }

      if (totalText.trim()) {
        const parsedTotal = parseCSV<TotalEmissionRecord>(totalText, (cols) => ({
          emission: cols[0],
          year: parseInt(cols[1], 10),
          value: parseFloat(cols[2]),
          units: cols[3] || "Kilotonne CO2 Equivalent",
        })).filter((r) => r.emission && !isNaN(r.year) && !isNaN(r.value));

        TOTAL_EMISSIONS_BY_GAS.length = 0;
        TOTAL_EMISSIONS_BY_GAS.push(...parsedTotal);
      } else {
        // Derive TOTAL_EMISSIONS_BY_GAS from DETAILED_EMISSIONS
        const map = new Map<string, TotalEmissionRecord>();
        DETAILED_EMISSIONS.forEach((r) => {
          const key = `${r.emission}_${r.year}`;
          const existing = map.get(key);
          if (existing) {
            existing.value += r.value;
          } else {
            map.set(key, {
              emission: r.emission,
              year: r.year,
              value: r.value,
              units: r.units,
            });
          }
        });

        TOTAL_EMISSIONS_BY_GAS.length = 0;
        TOTAL_EMISSIONS_BY_GAS.push(...Array.from(map.values()));
      }

      // Dynamically update available lists
      const countries = Array.from(new Set(DETAILED_EMISSIONS.map((r) => r.country))).sort();
      if (countries.length > 0) {
        AVAILABLE_COUNTRIES.length = 0;
        AVAILABLE_COUNTRIES.push(...countries);
      }

      const years = Array.from(new Set(DETAILED_EMISSIONS.map((r) => r.year))).sort((a, b) => a - b);
      if (years.length > 0) {
        AVAILABLE_YEARS.length = 0;
        AVAILABLE_YEARS.push(...years);
      }

      const gases = Array.from(new Set(DETAILED_EMISSIONS.map((r) => r.emission))).sort();
      if (gases.length > 0) {
        AVAILABLE_GASES.length = 0;
        AVAILABLE_GASES.push(...gases);
      }

      isLoaded = true;
      return true;
    } catch (err) {
      console.error("Failed to load emissions CSV data from public/data/data.csv:", err);
      return false;
    }
  })();

  return loadPromise;
}

// Auto-trigger loading if in browser environment
if (typeof window !== "undefined") {
  loadEmissionsData();
}

export function isEmissionsDataLoaded(): boolean {
  return isLoaded;
}

export function getCountryEmissions(): CountryEmissionRecord[] {
  return COUNTRY_EMISSIONS;
}

export function getTotalEmissionsByGas(): TotalEmissionRecord[] {
  return TOTAL_EMISSIONS_BY_GAS;
}

export function getDetailedEmissions(): DetailedEmissionRecord[] {
  return DETAILED_EMISSIONS;
}

