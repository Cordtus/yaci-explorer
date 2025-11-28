import { useEffect } from 'react'
import { useConfig } from '@/contexts/ConfigContext'
import { applyBrandingTheme } from '@/config/branding'

/**
 * Component that applies branding theme after hydration
 * Runs as a side effect in useEffect to avoid SSR issues
 */
export function BrandingApplicator() {
  const { branding } = useConfig()

  useEffect(() => {
    applyBrandingTheme(branding)
  }, [branding])

  return null
}
