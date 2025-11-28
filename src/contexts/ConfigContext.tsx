import { createContext, useContext } from 'react'
import type { ServerConfig } from '@/config/env.server'

export type AppConfig = ServerConfig

const ConfigContext = createContext<AppConfig | null>(null)

export function ConfigProvider({
  config,
  children,
}: {
  config: AppConfig
  children: React.ReactNode
}) {
  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  )
}

export function useConfig(): AppConfig {
  const config = useContext(ConfigContext)
  if (!config) {
    throw new Error('useConfig must be used within a ConfigProvider')
  }
  return config
}

export function usePostgrestUrl(): string {
  const config = useConfig()
  return config.postgrestUrl
}

export function useChainRestEndpoint(): string {
  const config = useConfig()
  return config.chainRestEndpoint
}
