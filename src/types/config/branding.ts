export interface BrandingConfig {
  appName: string
  appNameShort: string
  logoUrl?: string
  faviconUrl?: string
  primaryColor?: string
  accentColor?: string
  footerText?: string
  links?: {
    website?: string
    docs?: string
    github?: string
    discord?: string
    twitter?: string
  }
}
