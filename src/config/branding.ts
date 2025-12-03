import { getConfig } from '@/lib/env'

/**
 * Branding and visual identity configuration
 * Override these via config.json for chain-specific deployments
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
 * Get branding configuration from runtime config or defaults
 */
export function getBrandingConfig(): BrandingConfig {
  const config = getConfig()

  return {
    appName: config.appName || 'Republic Explorer',
    appNameShort: config.appNameShort || 'Explorer',
    logoUrl: config.branding?.logoUrl,
    faviconUrl: config.branding?.faviconUrl,
    primaryColor: config.branding?.primaryColor,
    accentColor: config.branding?.accentColor,
    footerText: config.branding?.footerText,
    links: {
      website: config.links?.website,
      docs: config.links?.docs,
      github: config.links?.github,
      discord: config.links?.discord,
      twitter: config.links?.twitter,
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
