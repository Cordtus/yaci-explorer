import { Link, useLocation } from 'react-router'
import { Blocks, Activity, Home, BarChart3, Vote } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SearchBar } from '@/components/common/search-bar'
import { useConfig } from '@/contexts/ConfigContext'
import { ResetNotice } from '@/components/common/reset-notice'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Blocks', href: '/blocks', icon: Blocks },
  { name: 'Transactions', href: '/transactions', icon: Activity },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Governance', href: '/governance', icon: Vote },
]

export function Header() {
  const location = useLocation()
  const pathname = location.pathname
  const { branding } = useConfig()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center space-x-2">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt={branding.appName} className="h-8 w-8" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary" />
              )}
              <span className="text-xl font-bold hidden sm:inline">{branding.appName}</span>
              <span className="text-xl font-bold sm:hidden">{branding.appNameShort}</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-2 transition-colors hover:text-foreground/80',
                      pathname === item.href
                        ? 'text-foreground'
                        : 'text-foreground/60'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <SearchBar />

            {/* Network info removed - will be added back with dynamic detection */}
          </div>
        </div>
      </div>
      <ResetNotice />
    </header>
  )
}
