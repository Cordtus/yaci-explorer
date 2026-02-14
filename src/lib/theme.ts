/**
 * Chain theme utilities
 * Applies lightweight CSS variable overrides for chain-specific accent colors
 * The base Park UI blue/slate design system remains unchanged
 */

import type { ChainTheme } from './env'

const DEFAULT_THEME: ChainTheme = {
	accentColor: '#3b82f6',
	accentColorFg: '#ffffff',
	accentColorSubtle: '#dbeafe',
}

/** Apply a chain's theme as CSS custom properties on :root */
export function applyChainTheme(theme?: Partial<ChainTheme>) {
	const root = document.documentElement
	const t = { ...DEFAULT_THEME, ...theme }

	root.style.setProperty('--chain-accent', t.accentColor)
	root.style.setProperty('--chain-accent-fg', t.accentColorFg)
	root.style.setProperty('--chain-accent-subtle', t.accentColorSubtle)
}

/** Reset chain theme to defaults */
export function resetChainTheme() {
	applyChainTheme(DEFAULT_THEME)
}
