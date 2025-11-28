import { env } from '@/lib/env'

/**
 * Branding and visual identity configuration
 * Override these via environment variables for chain-specific deployments
 */

export interface BrandingConfig {
  /** Application name displayed in header and title */
  appName: string
  /** Short name for mobile/compact views */
  appNameShort: string
  /** Logo URL or path to logo image */
  logoUrl?: string
  /** Favicon URL */
  faviconUrl?: string
  /** Primary brand color (HSL format: "222.2 47.4% 11.2%") */
  primaryColor?: string
  /** Accent color for highlights */
  accentColor?: string
  /** Footer text/credits */
  footerText?: string
  /** External links */
  links?: {
    website?: string
    docs?: string
    github?: string
    discord?: string
    twitter?: string
  }
}

/**
 * Get branding configuration from environment variables or defaults
 */
export function getBrandingConfig(): BrandingConfig {
  return {
    appName: env.VITE_APP_NAME || 'Republic Explorer',
    appNameShort: env.VITE_APP_NAME_SHORT || 'Explorer',
    logoUrl: env.VITE_LOGO_URL,
    faviconUrl: env.VITE_FAVICON_URL,
    primaryColor: env.VITE_PRIMARY_COLOR,
    accentColor: env.VITE_ACCENT_COLOR,
    footerText: env.VITE_FOOTER_TEXT,
    links: {
      website: env.VITE_LINK_WEBSITE,
      docs: env.VITE_LINK_DOCS,
      github: env.VITE_LINK_GITHUB,
      discord: env.VITE_LINK_DISCORD,
      twitter: env.VITE_LINK_TWITTER,
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
