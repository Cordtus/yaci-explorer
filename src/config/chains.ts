/**
 * Chain-specific configuration and feature detection
 * Add your chain here to enable chain-specific features and optimizations
 */

export const FEATURE_DEFAULTS = {
  evm: false,
  ibc: true,
  wasm: false,
  governance: true,
  staking: true,
} as const

/** Known per-chain feature flags. Add a key here to gate a new area. */
export type FeatureKey = keyof typeof FEATURE_DEFAULTS

export interface ChainFeatures extends Record<FeatureKey, boolean> {
  /** Chain has custom modules (module names, not booleans) */
  customModules?: string[]
  /** Allow per-chain flags beyond the known set (e.g. "compute") */
  [feature: string]: boolean | string[] | undefined
}

/** Per-chain overrides; unset flags fall back to FEATURE_DEFAULTS */
export type FeatureFlags = Partial<Record<FeatureKey, boolean>> & {
  customModules?: string[]
}

/** Resolve a chain's partial flags against the defaults */
export function resolveFeatures(flags?: FeatureFlags): ChainFeatures {
  return { ...FEATURE_DEFAULTS, ...flags } as ChainFeatures
}

export interface ChainConfig {
  /** Human-readable chain name */
  name: string
  /** Chain features */
  features: FeatureFlags
  /** Native base denomination (e.g., 'uatom', 'uexample') */
  nativeDenom: string
  /** Display symbol (e.g., 'ATOM', 'EX') */
  nativeSymbol: string
  /** Number of decimal places */
  decimals: number
  /** Optional: Block explorer URL pattern */
  explorerUrl?: string
  /** Bech32 address prefix (e.g., 'cosmos', 'osmo', 'example') */
  bech32Prefix: string
}

/**
 * Known chain configurations
 * Chain ID as key. Add your chains here; `/config.json` can override at runtime.
 */
export const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  'example-1': {
    name: 'Example EVM Chain',
    features: {
      evm: true,
      ibc: true,
      wasm: false,
    },
    nativeDenom: 'aexample',
    nativeSymbol: 'EX',
    decimals: 18,
    bech32Prefix: 'example',
  },
  'example-2': {
    name: 'Example Cosmos Chain',
    features: {
      evm: false,
      ibc: true,
      wasm: true,
      customModules: ['examplemodule'],
    },
    nativeDenom: 'uexample',
    nativeSymbol: 'EX',
    decimals: 6,
    bech32Prefix: 'example',
  },
}

/**
 * Get chain configuration by chain ID
 * Returns default config if chain ID not found
 */
export function getChainConfig(chainId: string): ChainConfig {
  const config = CHAIN_CONFIGS[chainId]
  if (config) {
    return config
  }

  // Return default config for unknown chains
  console.warn(`Chain ID ${chainId} not found in CHAIN_CONFIGS, using defaults`)
  return {
    name: `Chain ${chainId}`,
    features: {
      evm: false,
      ibc: true,
      wasm: false,
    },
    nativeDenom: 'unknown',
    nativeSymbol: 'UNKNOWN',
    decimals: 6,
    bech32Prefix: 'cosmos',
  }
}

