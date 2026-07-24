"use client";

import React, { useState, useEffect } from "react";
import { CountryRanking, formatEmissionsValue } from "../lib/dataProcessor";
import { ColorScheme } from "../lib/theme";
import { REAL_WORLD_PATHS, GeoCountryPath, FREE_GEOJSON_API_URL } from "../lib/geoWorldData";

export interface WorldMapProps {
  selectedYear: number;
  selectedGas: string;
  selectedCountry: string;
  topEmitters: CountryRanking[];
  maxCountryValue: number;
  activeGasTheme: ColorScheme;
  hoveredCountryData: CountryRanking | null;
  onHoverCountry: (country: CountryRanking | null) => void;
  onSelectCountry: (countryName: string) => void;
  onAddCountryToBar: (countryName: string) => void;
  plottedCountries: string[];
}

// Latitude & Longitude Lookup for monitored emissions dataset countries
const COUNTRY_COORDINATES: Record<string, { lat: number; lng: number; code: string }> = {
  "Australia": { lat: -25.27, lng: 133.77, code: "AUS" },
  "Austria": { lat: 47.51, lng: 14.55, code: "AUT" },
  "Belarus": { lat: 53.7, lng: 27.95, code: "BLR" },
  "Belgium": { lat: 50.5, lng: 4.4, code: "BEL" },
  "Bulgaria": { lat: 42.7, lng: 25.48, code: "BGR" },
  "Canada": { lat: 56.13, lng: -106.34, code: "CAN" },
  "Croatia": { lat: 45.1, lng: 15.2, code: "HRV" },
  "Cyprus": { lat: 35.12, lng: 33.42, code: "CYP" },
  "Czech Republic": { lat: 49.81, lng: 15.47, code: "CZE" },
  "Denmark": { lat: 56.26, lng: 9.5, code: "DNK" },
  "Estonia": { lat: 58.59, lng: 25.0, code: "EST" },
  "European Union": { lat: 50.0, lng: 10.0, code: "EU" },
  "Finland": { lat: 61.92, lng: 25.74, code: "FIN" },
  "France": { lat: 46.22, lng: 2.21, code: "FRA" },
  "Germany": { lat: 51.16, lng: 10.45, code: "DEU" },
  "Greece": { lat: 39.07, lng: 21.82, code: "GRC" },
  "Hungary": { lat: 47.16, lng: 19.5, code: "HUN" },
  "Iceland": { lat: 64.96, lng: -19.02, code: "ISL" },
  "Ireland": { lat: 53.41, lng: -8.24, code: "IRL" },
  "Italy": { lat: 41.87, lng: 12.56, code: "ITA" },
  "Japan": { lat: 36.2, lng: 138.25, code: "JPN" },
  "Latvia": { lat: 56.87, lng: 24.6, code: "LVA" },
  "Liechtenstein": { lat: 47.16, lng: 9.55, code: "LIE" },
  "Lithuania": { lat: 55.16, lng: 23.9, code: "LTU" },
  "Luxembourg": { lat: 49.81, lng: 6.12, code: "LUX" },
  "Malta": { lat: 35.93, lng: 14.37, code: "MLT" },
  "Monaco": { lat: 43.73, lng: 7.42, code: "MCO" },
  "Netherlands": { lat: 52.13, lng: 5.29, code: "NLD" },
  "New Zealand": { lat: -40.9, lng: 174.88, code: "NZL" },
  "Norway": { lat: 60.47, lng: 8.46, code: "NOR" },
  "Poland": { lat: 51.91, lng: 19.14, code: "POL" },
  "Portugal": { lat: 39.39, lng: -8.22, code: "PRT" },
  "Romania": { lat: 45.94, lng: 24.96, code: "ROU" },
  "Russian Federation": { lat: 61.52, lng: 105.31, code: "RUS" },
  "Slovakia": { lat: 48.66, lng: 19.7, code: "SVK" },
  "Slovenia": { lat: 46.15, lng: 14.99, code: "SVN" },
  "Spain": { lat: 40.46, lng: -3.74, code: "ESP" },
  "Sweden": { lat: 60.12, lng: 18.64, code: "SWE" },
  "Switzerland": { lat: 46.81, lng: 8.22, code: "CHE" },
  "Turkey": { lat: 38.96, lng: 35.24, code: "TUR" },
  "Ukraine": { lat: 48.37, lng: 31.16, code: "UKR" },
  "United Kingdom": { lat: 55.37, lng: -3.43, code: "GBR" },
  "United States of America": { lat: 37.09, lng: -95.71, code: "USA" },
};

/**
 * Projects Geographic Lat/Lng to SVG Canvas Coordinates (Width: 1000, Height: 500)
 */
function projectCoords(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng + 180) / 360) * 1000;
  const y = ((90 - lat) / 180) * 500;
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

export const WorldMap: React.FC<WorldMapProps> = ({
  selectedYear,
  selectedGas,
  selectedCountry,
  topEmitters,
  maxCountryValue,
  activeGasTheme,
  hoveredCountryData,
  onHoverCountry,
  onSelectCountry,
  onAddCountryToBar,
  plottedCountries,
}) => {
  const [worldPaths, setWorldPaths] = useState<GeoCountryPath[]>(REAL_WORLD_PATHS);
  const [apiStatus, setApiStatus] = useState<string>("Free GeoJSON API Active");

  // Zoom & Pan State
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [startPanPos, setStartPanPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Fetch Real World GeoJSON dynamically from free public CDN API
  useEffect(() => {
    async function fetchFreeGeoJsonMap() {
      try {
        const res = await fetch(FREE_GEOJSON_API_URL);
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.features) {
          const parsedPaths: GeoCountryPath[] = data.features.map((f: any) => {
            const name = f.properties?.name || "Country";
            const cid = f.id || name;
            const geomType = f.geometry?.type;
            const coords = f.geometry?.coordinates;

            const ringToPath = (ring: number[][]) => {
              const pts = ring.map(([lng, lat]) => {
                const x = Math.round(((lng + 180) / 360) * 1000 * 10) / 10;
                const y = Math.round(((90 - lat) / 180) * 500 * 10) / 10;
                return `${x} ${y}`;
              });
              return `M ${pts.join(" L ")} Z`;
            };

            const dPaths: string[] = [];
            if (geomType === "Polygon") {
              coords.forEach((ring: number[][]) => dPaths.push(ringToPath(ring)));
            } else if (geomType === "MultiPolygon") {
              coords.forEach((poly: number[][][]) => {
                poly.forEach((ring: number[][]) => dPaths.push(ringToPath(ring)));
              });
            }

            return { id: cid, name, d: dPaths.join(" ") };
          });

          setWorldPaths(parsedPaths);
          setApiStatus("Live GeoJSON API Sync (180 Real Countries)");
        }
      } catch (err) {
        // Fallback dataset active
      }
    }

    fetchFreeGeoJsonMap();
  }, []);

  // Zoom Controls Handlers
  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(5.0, Math.round((prev + 0.35) * 100) / 100));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => {
      const next = Math.max(1.0, Math.round((prev - 0.35) * 100) / 100);
      if (next === 1.0) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomScale(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleWheelZoom = (e: React.WheelEvent) => {
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handleMouseDownPan = (e: React.MouseEvent) => {
    if (zoomScale > 1.0) {
      setIsPanning(true);
      setStartPanPos({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMovePan = (e: React.MouseEvent) => {
    if (isPanning && zoomScale > 1.0) {
      setPanOffset({
        x: e.clientX - startPanPos.x,
        y: e.clientY - startPanPos.y,
      });
    }
  };

  const handleMouseUpPan = () => {
    setIsPanning(false);
  };

  const handleDragStart = (e: React.DragEvent, countryName: string) => {
    e.dataTransfer.setData("text/plain", countryName);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="relative w-full overflow-hidden pt-2 bg-slate-950/90 rounded-xl border border-slate-800/80 p-2 shadow-2xl space-y-2">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between px-2 text-[10px] text-slate-400">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {apiStatus}
        </span>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-mono">Zoom: Math.round({Math.round(zoomScale * 100)}%)</span>

          {/* Floating Zoom Control Buttons */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={handleZoomIn}
              className="px-2 py-0.5 rounded hover:bg-slate-800 text-emerald-400 font-bold transition-all"
              title="Zoom In (+)"
            >
              +
            </button>
            <span className="px-1.5 font-mono text-[10px] text-slate-300">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={handleZoomOut}
              className="px-2 py-0.5 rounded hover:bg-slate-800 text-rose-400 font-bold transition-all"
              title="Zoom Out (-)"
            >
              -
            </button>
            <button
              onClick={handleResetZoom}
              className="px-2 py-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all ml-0.5 border-l border-slate-800"
              title="Reset Zoom (100%)"
            >
              ↺ Reset
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas with Interactive Wheel Zoom & Pan */}
      <div
        className={`relative w-full overflow-hidden rounded-lg border border-slate-800/60 bg-slate-950 ${
          zoomScale > 1.0 ? "cursor-grab active:cursor-grabbing" : ""
        }`}
        onWheel={handleWheelZoom}
        onMouseDown={handleMouseDownPan}
        onMouseMove={handleMouseMovePan}
        onMouseUp={handleMouseUpPan}
        onMouseLeave={handleMouseUpPan}
      >
        <svg viewBox="0 0 1000 500" className="w-full h-auto overflow-hidden select-none">
          <defs>
            <filter id="mapBubbleGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <linearGradient id="oceanGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#020617" />
              <stop offset="100%" stopColor="#090d16" />
            </linearGradient>
          </defs>

          {/* Ocean Background Canvas */}
          <rect x="0" y="0" width="1000" height="500" fill="url(#oceanGrad)" />

          {/* Main Map Group with Zoom & Pan Transform Matrix */}
          <g
            transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomScale})`}
            className="transition-transform duration-100 ease-out"
          >
            {/* Latitude & Longitude Coordinate Grid */}
            {[-60, -30, 0, 30, 60].map((lat) => {
              const y = ((90 - lat) / 180) * 500;
              return (
                <line
                  key={`lat-${lat}`}
                  x1="0"
                  y1={y}
                  x2="1000"
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="2 4"
                  strokeWidth={0.5 / zoomScale}
                />
              );
            })}
            {[-120, -60, 0, 60, 120].map((lng) => {
              const x = ((lng + 180) / 360) * 1000;
              return (
                <line
                  key={`lng-${lng}`}
                  x1={x}
                  y1="0"
                  x2={x}
                  y2="500"
                  stroke="#1e293b"
                  strokeDasharray="2 4"
                  strokeWidth={0.5 / zoomScale}
                />
              );
            })}

            {/* Real Country Polygons Fetched from Free GeoJSON API */}
            <g opacity="0.85">
              {worldPaths.map((countryPath) => {
                const isSelected = selectedCountry.toLowerCase() === countryPath.name.toLowerCase();
                return (
                  <path
                    key={countryPath.id}
                    d={countryPath.d}
                    fill={isSelected ? "#065f46" : "#1e293b"}
                    stroke={isSelected ? "#10b981" : "#334155"}
                    strokeWidth={(isSelected ? 1.2 : 0.6) / Math.sqrt(zoomScale)}
                    className="transition-all duration-200 hover:fill-slate-800 hover:stroke-slate-500 cursor-pointer"
                    onClick={() => onSelectCountry(countryPath.name)}
                  >
                    <title>{countryPath.name}</title>
                  </path>
                );
              })}
            </g>

            {/* Country Emission Bubbles Rendered at Projected Coordinates */}
            {topEmitters.map((emitter) => {
              const geo = COUNTRY_COORDINATES[emitter.country];
              if (!geo) return null;

              const proj = projectCoords(geo.lat, geo.lng);
              const rawRadius = Math.sqrt(emitter.value / maxCountryValue) * 42;
              // Scale bubble radius down slightly when zoomed in so they don't block whole regions
              const radius = Math.max(5, Math.min(48, rawRadius / Math.sqrt(zoomScale)));

              const isHovered = hoveredCountryData?.country === emitter.country;
              const isPlotted = plottedCountries.includes(emitter.country);
              const isTopRank = emitter.rank === 1;

              return (
                <g
                  key={emitter.country}
                  className="cursor-grab active:cursor-grabbing group"
                  onMouseEnter={() => onHoverCountry(emitter)}
                  onMouseLeave={() => onHoverCountry(null)}
                  onClick={() => {
                    onSelectCountry(emitter.country);
                    onAddCountryToBar(emitter.country);
                  }}
                >
                  {/* Outer Pulsing Ring for #1 Top Emitter */}
                  {isTopRank && (
                    <circle
                      cx={proj.x}
                      cy={proj.y}
                      r={radius + 8 / Math.sqrt(zoomScale)}
                      fill="none"
                      stroke={activeGasTheme.hex}
                      strokeWidth={1.5 / zoomScale}
                      className="animate-ping opacity-60"
                    />
                  )}

                  {/* Main Country Bubble */}
                  <circle
                    cx={proj.x}
                    cy={proj.y}
                    r={isHovered ? radius + 4 : radius}
                    fill={isPlotted ? "#10b981" : activeGasTheme.hex}
                    fillOpacity={isHovered || isPlotted ? 0.85 : 0.45}
                    stroke={isHovered || isPlotted ? "#ffffff" : activeGasTheme.hex}
                    strokeWidth={(isHovered || isPlotted ? 2.5 : 1.2) / Math.sqrt(zoomScale)}
                    filter={isHovered ? "url(#mapBubbleGlow)" : undefined}
                    className="transition-all duration-300"
                    {...({
                      draggable: true,
                      onDragStart: (e: React.DragEvent) => handleDragStart(e, emitter.country),
                    } as any)}
                  />

                  {/* Center Coordinate Pin */}
                  <circle cx={proj.x} cy={proj.y} r={2 / Math.sqrt(zoomScale)} fill="#ffffff" />

                  {/* Country ISO Code Tag */}
                  {(radius > 10 || isHovered || isPlotted) && (
                    <text
                      x={proj.x}
                      y={proj.y + (radius > 16 ? 4 : -radius - 4)}
                      fill="#ffffff"
                      fontSize={Math.max(8, (isHovered ? 11 : 9) / Math.sqrt(zoomScale))}
                      fontWeight={isHovered || isPlotted ? "bold" : "600"}
                      textAnchor="middle"
                      className="pointer-events-none drop-shadow-md font-mono"
                    >
                      {geo.code}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Floating Hover Details Box */}
        {hoveredCountryData && (
          <div className="absolute bottom-4 left-4 pointer-events-none bg-slate-900/95 p-3 rounded-xl border border-emerald-500/50 shadow-xl space-y-1 text-xs backdrop-blur-md">
            <div className="font-bold text-slate-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              {hoveredCountryData.country}
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono">
                Rank #{hoveredCountryData.rank}
              </span>
            </div>
            <div className="text-slate-300">
              Emissions ({selectedYear}): <span className="font-bold text-emerald-400">{formatEmissionsValue(hoveredCountryData.value)}</span>
            </div>
            <div className="text-slate-400 text-[11px]">
              Drag to comparison bar or click to add!
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
