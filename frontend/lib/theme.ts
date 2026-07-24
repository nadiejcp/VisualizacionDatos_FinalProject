/**
 * Emissions Data Visualization - Theme & Color System
 * Strictly integrated with Tailwind CSS utility classes and color tokens.
 */

export interface ColorScheme {
  hex: string;
  twText: string;
  twBg: string;
  twBorder: string;
  twBadge: string;
  twGradient: string;
}

export const GAS_PALETTE: Record<string, ColorScheme> = {
  "CO2": {
    hex: "#f43f5e",
    twText: "text-rose-400",
    twBg: "bg-rose-500/10",
    twBorder: "border-rose-500/30",
    twBadge: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    twGradient: "from-rose-500 to-red-600",
  },
  "CO2 Emissions": {
    hex: "#f43f5e",
    twText: "text-rose-400",
    twBg: "bg-rose-500/10",
    twBorder: "border-rose-500/30",
    twBadge: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    twGradient: "from-rose-500 to-red-600",
  },
  "CH4": {
    hex: "#10b981",
    twText: "text-emerald-400",
    twBg: "bg-emerald-500/10",
    twBorder: "border-emerald-500/30",
    twBadge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    twGradient: "from-emerald-500 to-teal-600",
  },
  "CH4 Emissions": {
    hex: "#10b981",
    twText: "text-emerald-400",
    twBg: "bg-emerald-500/10",
    twBorder: "border-emerald-500/30",
    twBadge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    twGradient: "from-emerald-500 to-teal-600",
  },
  "N2O": {
    hex: "#8b5cf6",
    twText: "text-violet-400",
    twBg: "bg-violet-500/10",
    twBorder: "border-violet-500/30",
    twBadge: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    twGradient: "from-violet-500 to-purple-600",
  },
  "N2O Emissions": {
    hex: "#8b5cf6",
    twText: "text-violet-400",
    twBg: "bg-violet-500/10",
    twBorder: "border-violet-500/30",
    twBadge: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    twGradient: "from-violet-500 to-purple-600",
  },
  "HFC": {
    hex: "#06b6d4",
    twText: "text-cyan-400",
    twBg: "bg-cyan-500/10",
    twBorder: "border-cyan-500/30",
    twBadge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    twGradient: "from-cyan-500 to-blue-600",
  },
  "HFC Emissions": {
    hex: "#06b6d4",
    twText: "text-cyan-400",
    twBg: "bg-cyan-500/10",
    twBorder: "border-cyan-500/30",
    twBadge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    twGradient: "from-cyan-500 to-blue-600",
  },
  "PFC": {
    hex: "#3b82f6",
    twText: "text-blue-400",
    twBg: "bg-blue-500/10",
    twBorder: "border-blue-500/30",
    twBadge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    twGradient: "from-blue-500 to-indigo-600",
  },
  "PFC Emissions": {
    hex: "#3b82f6",
    twText: "text-blue-400",
    twBg: "bg-blue-500/10",
    twBorder: "border-blue-500/30",
    twBadge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    twGradient: "from-blue-500 to-indigo-600",
  },
  "SF6": {
    hex: "#f59e0b",
    twText: "text-amber-400",
    twBg: "bg-amber-500/10",
    twBorder: "border-amber-500/30",
    twBadge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    twGradient: "from-amber-500 to-orange-600",
  },
  "SF6 Emissions": {
    hex: "#f59e0b",
    twText: "text-amber-400",
    twBg: "bg-amber-500/10",
    twBorder: "border-amber-500/30",
    twBadge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    twGradient: "from-amber-500 to-orange-600",
  },
  "GHG": {
    hex: "#38bdf8",
    twText: "text-sky-400",
    twBg: "bg-sky-500/10",
    twBorder: "border-sky-500/30",
    twBadge: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    twGradient: "from-sky-500 to-cyan-600",
  },
  "GHG Emissions": {
    hex: "#38bdf8",
    twText: "text-sky-400",
    twBg: "bg-sky-500/10",
    twBorder: "border-sky-500/30",
    twBadge: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    twGradient: "from-sky-500 to-cyan-600",
  },
  "All": {
    hex: "#a855f7",
    twText: "text-purple-400",
    twBg: "bg-purple-500/10",
    twBorder: "border-purple-500/30",
    twBadge: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    twGradient: "from-purple-500 to-indigo-600",
  }
};

export const TREND_PALETTE = {
  increase: {
    hex: "#ef4444",
    twText: "text-red-400",
    twBg: "bg-red-500/10",
    twBorder: "border-red-500/20",
    twBadge: "bg-red-500/15 text-red-400 border-red-500/30",
  },
  decrease: {
    hex: "#10b981",
    twText: "text-emerald-400",
    twBg: "bg-emerald-500/10",
    twBorder: "border-emerald-500/20",
    twBadge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  neutral: {
    hex: "#9ca3af",
    twText: "text-gray-400",
    twBg: "bg-gray-500/10",
    twBorder: "border-gray-500/20",
    twBadge: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  }
};

export const UI_PALETTE = {
  pageBg: "bg-slate-950 text-slate-100",
  heroGlow: "bg-gradient-to-r from-emerald-600/20 via-sky-600/20 to-indigo-600/20 blur-3xl",
  cardBg: "bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 hover:border-slate-700/80 transition-all duration-300",
  cardBgActive: "bg-slate-900/90 backdrop-blur-xl border border-emerald-500/50 shadow-lg shadow-emerald-950/40",
  headerBg: "bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60",
  inputBg: "bg-slate-900/90 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30",
  buttonPrimary: "bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-semibold hover:from-emerald-400 hover:to-teal-500 shadow-md shadow-emerald-950/50 transition-all duration-200",
  buttonSecondary: "bg-slate-800/80 border border-slate-700/80 text-slate-200 hover:bg-slate-700/80 transition-all duration-200",
  chartColors: ["#10b981", "#38bdf8", "#8b5cf6", "#f43f5e", "#f59e0b", "#06b6d4", "#ec4899", "#84cc16"]
};

export function getGasTheme(gasName: string): ColorScheme {
  const normalized = gasName.trim();
  return GAS_PALETTE[normalized] || {
    hex: "#38bdf8",
    twText: "text-sky-400",
    twBg: "bg-sky-500/10",
    twBorder: "border-sky-500/30",
    twBadge: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    twGradient: "from-sky-500 to-cyan-600",
  };
}

export function getTrendTheme(value: number) {
  if (value > 0.05) return TREND_PALETTE.increase;
  if (value < -0.05) return TREND_PALETTE.decrease;
  return TREND_PALETTE.neutral;
}
