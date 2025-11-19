/**
 * Branding and visual identity configuration
 * Override these via environment variables for chain-specific deployments
 */
import { type BrandingConfig } from '@/types/config/branding'
export type { BrandingConfig } from '@/types/config/branding'

/**
 * Get branding configuration from environment variables or defaults
 */
export function getBrandingConfig(): BrandingConfig {
  return {
    appName: import.meta.env.VITE_APP_NAME || 'Yaci Explorer',
    appNameShort: import.meta.env.VITE_APP_NAME_SHORT || 'Explorer',
    logoUrl: import.meta.env.VITE_LOGO_URL,
    faviconUrl: import.meta.env.VITE_FAVICON_URL,
    primaryColor: import.meta.env.VITE_PRIMARY_COLOR,
    accentColor: import.meta.env.VITE_ACCENT_COLOR,
    footerText: import.meta.env.VITE_FOOTER_TEXT,
    links: {
      website: import.meta.env.VITE_LINK_WEBSITE,
      docs: import.meta.env.VITE_LINK_DOCS,
      github: import.meta.env.VITE_LINK_GITHUB,
      discord: import.meta.env.VITE_LINK_DISCORD,
      twitter: import.meta.env.VITE_LINK_TWITTER,
    },
  }
}

/**
 * Apply branding theme colors to CSS variables
 */
export function applyBrandingTheme(config: BrandingConfig) {
  const root = document.documentElement

  if (config.primaryColor) {
    root.style.setProperty('--primary', config.primaryColor)
  }

  if (config.accentColor) {
    root.style.setProperty('--accent', config.accentColor)
  }

  // Update document title
  document.title = config.appName

  // Update favicon if provided
  if (config.faviconUrl) {
    const link: HTMLLinkElement =
      document.querySelector("link[rel*='icon']") ||
      document.createElement('link')
    link.type = 'image/x-icon'
    link.rel = 'shortcut icon'
    link.href = config.faviconUrl
    document.getElementsByTagName('head')[0].appendChild(link)
  }
}
