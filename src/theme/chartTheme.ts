type ChartColorKey = 'transactions' | 'gas' | 'grid' | 'axis'

const CHART_COLOR_VARS: Record<ChartColorKey, string> = {
  transactions: '--colors-chart-transactions',
  gas: '--colors-chart-gas',
  grid: '--colors-chart-grid',
  axis: '--colors-chart-axis',
}

// Fallbacks mirror panda.config.ts semantic tokens for SSR and safety
const CHART_FALLBACKS: Record<ChartColorKey, string> = {
  transactions: '#3b82f6',
  gas: '#10b981',
  grid: '#e5e7eb',
  axis: '#9ca3af',
}

function readCssVar(variable: string, fallback: string) {
  if (typeof document === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable)
  return value?.trim() || fallback
}

/**
 * Retrieves theme-aware chart colors from Panda CSS variables with SSR fallbacks.
 */
export function getChartColors(): Record<ChartColorKey, string> {
  return {
    transactions: readCssVar(CHART_COLOR_VARS.transactions, CHART_FALLBACKS.transactions),
    gas: readCssVar(CHART_COLOR_VARS.gas, CHART_FALLBACKS.gas),
    grid: readCssVar(CHART_COLOR_VARS.grid, CHART_FALLBACKS.grid),
    axis: readCssVar(CHART_COLOR_VARS.axis, CHART_FALLBACKS.axis),
  }
}
