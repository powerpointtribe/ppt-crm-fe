// Theme constants for consistent styling across the application
// Reference: FirstTimerReports.tsx styling patterns

// Color palette - hex values for JS/charts
export const COLORS = {
  primary: '#6366F1',   // indigo-500
  secondary: '#8B5CF6', // violet-500
  success: '#10B981',   // emerald-500
  warning: '#F59E0B',   // amber-500
  danger: '#EF4444',    // red-500
  info: '#3B82F6',      // blue-500
  cyan: '#06B6D4',      // cyan-500
  pink: '#EC4899',      // pink-500
} as const

// Chart colors array for Recharts
export const CHART_COLORS = [
  '#6366F1', // indigo
  '#8B5CF6', // violet
  '#06B6D4', // cyan
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EC4899', // pink
] as const

// Tailwind class strings for icon backgrounds
export const COLOR_CLASSES = {
  indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  red: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  cyan: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  pink: 'bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
} as const

// Card styling constants
export const CARD_STYLES = {
  base: 'bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700',
  hover: 'hover:shadow-md transition-shadow',
  padding: 'p-4 sm:p-6',
} as const

// Typography classes
export const TYPOGRAPHY = {
  pageTitle: 'text-lg font-bold text-gray-900 dark:text-white',
  sectionTitle: 'text-sm font-semibold text-gray-900 dark:text-white',
  statValue: 'text-2xl font-bold text-gray-900 dark:text-white',
  label: 'text-xs font-medium text-gray-500 dark:text-gray-400',
  smallText: 'text-[10px] text-gray-400',
} as const

export type ColorKey = keyof typeof COLOR_CLASSES
