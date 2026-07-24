"use client";

import React from "react";
import { CountryRanking, formatEmissionsValue } from "../lib/dataProcessor";
import { ColorScheme } from "../lib/theme";

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

// Lat/Lng Lookup for all 43 monitored countries + major nations
const REAL_COUNTRY_COORDS: Record<string, { lat: number; lng: number; code: string }> = {
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
  const handleDragStart = (e: React.DragEvent, countryName: string) => {
    e.dataTransfer.setData("text/plain", countryName);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="relative w-full overflow-hidden pt-2 bg-slate-950/90 rounded-xl border border-slate-800/80 p-2 shadow-2xl">
      <svg viewBox="0 0 1000 500" className="w-full h-auto overflow-visible select-none">
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
        <rect x="0" y="0" width="1000" height="500" fill="url(#oceanGrad)" rx="8" />

        {/* Latitude & Longitude Coordinate Lines */}
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
              strokeWidth="0.5"
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
              strokeWidth="0.5"
            />
          );
        })}

        {/* Real Geographic World Landmass Outlines */}
        <g fill="#1e293b" stroke="#334155" strokeWidth="0.8" opacity="0.85">
          {/* North America */}
          <path d="M 120 70 L 170 50 L 250 40 L 300 70 L 280 120 L 240 140 L 220 180 L 190 220 L 160 190 L 140 140 L 110 100 Z" />
          {/* Greenland */}
          <path d="M 330 30 L 410 25 L 430 70 L 370 85 L 340 60 Z" />
          {/* South America */}
          <path d="M 280 230 L 360 220 L 410 280 L 370 380 L 330 440 L 300 420 L 290 320 L 270 270 Z" />
          {/* Europe */}
          <path d="M 470 70 L 580 60 L 610 110 L 590 150 L 530 160 L 480 140 L 460 100 Z" />
          {/* Africa */}
          <path d="M 460 170 L 590 160 L 630 220 L 610 320 L 560 390 L 500 370 L 460 280 Z" />
          {/* Asia */}
          <path d="M 590 60 L 890 50 L 940 110 L 920 190 L 860 210 L 810 240 L 740 230 L 690 190 L 610 150 Z" />
          {/* Australia & Oceania */}
          <path d="M 810 310 L 920 300 L 940 370 L 890 410 L 820 390 L 800 340 Z" />
          {/* New Zealand */}
          <path d="M 960 390 L 980 410 L 965 435 L 950 415 Z" />
          {/* Antarctica */}
          <path d="M 100 475 L 900 475 L 950 495 L 50 495 Z" />
        </g>

        {/* Country Emission Bubbles Rendered at Exact Lat/Lng Coordinates */}
        {topEmitters.map((emitter) => {
          const geo = REAL_COUNTRY_COORDS[emitter.country];
          if (!geo) return null;

          const proj = projectCoords(geo.lat, geo.lng);
          const rawRadius = Math.sqrt(emitter.value / maxCountryValue) * 42;
          const radius = Math.max(6, Math.min(48, rawRadius));

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
                  r={radius + 9}
                  fill="none"
                  stroke={activeGasTheme.hex}
                  strokeWidth="1.5"
                  className="animate-ping opacity-60"
                />
              )}

              {/* Main Country Bubble */}
              <circle
                cx={proj.x}
                cy={proj.y}
                r={isHovered ? radius + 5 : radius}
                fill={isPlotted ? "#10b981" : activeGasTheme.hex}
                fillOpacity={isHovered || isPlotted ? 0.85 : 0.45}
                stroke={isHovered || isPlotted ? "#ffffff" : activeGasTheme.hex}
                strokeWidth={isHovered || isPlotted ? 2.5 : 1.2}
                filter={isHovered ? "url(#mapBubbleGlow)" : undefined}
                className="transition-all duration-300"
                {...({
                  draggable: true,
                  onDragStart: (e: React.DragEvent) => handleDragStart(e, emitter.country),
                } as any)}
              />

              {/* Center Coordinate Pin */}
              <circle cx={proj.x} cy={proj.y} r="2" fill="#ffffff" />

              {/* Country ISO Code Tag */}
              {(radius > 13 || isHovered || isPlotted) && (
                <text
                  x={proj.x}
                  y={proj.y + (radius > 18 ? 4 : -radius - 4)}
                  fill="#ffffff"
                  fontSize={isHovered ? "11" : "9"}
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
  );
};
