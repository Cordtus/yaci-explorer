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
  /** Native base denomination (e.g., 'umfx', 'ujuno') */
  nativeDenom: string
  /** Display symbol (e.g., 'MFX', 'JUNO') */
  nativeSymbol: string
  /** Number of decimal places */
  decimals: number
  /** Optional: Block explorer URL pattern */
  explorerUrl?: string
  /** Bech32 address prefix (e.g., 'cosmos', 'osmo', 'manifest') */
  bech32Prefix: string
}

/**
 * Known chain configurations
 * Chain ID as key
 */
export const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  'manifest-1': {
    name: 'Manifest Network',
    features: {
      evm: true,
      ibc: true,
      wasm: false,
    },
    nativeDenom: 'umfx',
    nativeSymbol: 'MFX',
    decimals: 6,
    bech32Prefix: 'manifest',
  },
  'juno-1': {
    name: 'Juno Network',
    features: {
      evm: false,
      ibc: true,
      wasm: true,
    },
    nativeDenom: 'ujuno',
    nativeSymbol: 'JUNO',
    decimals: 6,
    bech32Prefix: 'juno',
  },
  'osmosis-1': {
    name: 'Osmosis',
    features: {
      evm: false,
      ibc: true,
      wasm: true,
      customModules: ['poolmanager', 'gamm', 'concentrated-liquidity'],
    },
    nativeDenom: 'uosmo',
    nativeSymbol: 'OSMO',
    decimals: 6,
    bech32Prefix: 'osmo',
  },
  'cosmoshub-4': {
    name: 'Cosmos Hub',
    features: {
      evm: false,
      ibc: true,
      wasm: false,
    },
    nativeDenom: 'uatom',
    nativeSymbol: 'ATOM',
    decimals: 6,
    bech32Prefix: 'cosmos',
  },
  'stargaze-1': {
    name: 'Stargaze',
    features: {
      evm: false,
      ibc: true,
      wasm: true,
      customModules: ['nft'],
    },
    nativeDenom: 'ustars',
    nativeSymbol: 'STARS',
    decimals: 6,
    bech32Prefix: 'stars',
  },
  'evmos_9001-2': {
    name: 'Evmos',
    features: {
      evm: true,
      ibc: true,
      wasm: false,
      customModules: ['erc20', 'claims'],
    },
    nativeDenom: 'aevmos',
    nativeSymbol: 'EVMOS',
    decimals: 18,
    bech32Prefix: 'evmos',
  },
  'neutron-1': {
    name: 'Neutron',
    features: {
      evm: false,
      ibc: true,
      wasm: true,
      customModules: ['interchainqueries', 'interchaintxs'],
    },
    nativeDenom: 'untrn',
    nativeSymbol: 'NTRN',
    decimals: 6,
    bech32Prefix: 'neutron',
  },
  'republic_9001-1': {
    name: 'Republic Devnet',
    features: {
      evm: true,
      ibc: true,
      wasm: false,
    },
    nativeDenom: 'atest',
    nativeSymbol: 'TEST',
    decimals: 18,
    bech32Prefix: 'rai',
  },
  '9001': {
    name: 'Local Cosmos EVM POC',
    features: {
      evm: true,
      ibc: true,
      wasm: true,
      customModules: ['erc20', 'feemarket', 'ibc-go', '08-wasm'],
    },
    nativeDenom: 'atest',
    nativeSymbol: 'TEST',
    decimals: 18,
    bech32Prefix: 'cosmos',
  },
  'republic_77701-1': {
    name: 'Republic AI',
    features: {
      evm: true,
      ibc: true,
      wasm: false,
    },
    nativeDenom: 'arai',
    nativeSymbol: 'RAI',
    decimals: 18,
    bech32Prefix: 'rai',
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

/**
 * Check if chain has specific feature
 */
export function hasChainFeature(
  chainId: string,
  feature: string
): boolean {
  return Boolean(resolveFeatures(getChainConfig(chainId).features)[feature])
}

/**
 * Get all configured chain IDs
 */
export function getAllChainIds(): string[] {
  return Object.keys(CHAIN_CONFIGS)
}

/**
 * Detect if message type is chain-specific
 */
export function isChainSpecificMessage(messageType: string): {
  isCustom: boolean
  moduleName?: string
  chainRecommendation?: string
} {
  // EVM messages
  if (messageType.includes('MsgEthereumTx') || messageType.includes('evm')) {
    return {
      isCustom: true,
      moduleName: 'evm',
      chainRecommendation: 'This message type requires EVM module support',
    }
  }

  // CosmWasm messages
  if (messageType.includes('cosmwasm') || messageType.includes('wasm')) {
    return {
      isCustom: true,
      moduleName: 'wasm',
      chainRecommendation: 'This message type requires CosmWasm support',
    }
  }

  // Osmosis-specific
  if (messageType.includes('osmosis')) {
    return {
      isCustom: true,
      moduleName: 'osmosis-custom',
      chainRecommendation: 'Osmosis-specific module',
    }
  }

  // Standard Cosmos SDK message
  return { isCustom: false }
}
