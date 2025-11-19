export interface ChainFeatures {
  /** Chain has EVM module (MsgEthereumTx support) */
  evm: boolean
  /** Chain has IBC support */
  ibc: boolean
  /** Chain has CosmWasm support */
  wasm: boolean
  /** Chain has custom modules */
  customModules?: string[]
}

export interface ChainConfig {
  /** Human-readable chain name */
  name: string
  /** Chain features */
  features: ChainFeatures
  /** Native base denomination (e.g., 'umfx', 'ujuno') */
  nativeDenom: string
  /** Display symbol (e.g., 'MFX', 'JUNO') */
  nativeSymbol: string
  /** Number of decimal places */
  decimals: number
  /** Optional: RPC endpoint for additional queries */
  rpcEndpoint?: string
  /** Optional: REST API endpoint */
  restEndpoint?: string
  /** Optional: Block explorer URL pattern */
  explorerUrl?: string
}
