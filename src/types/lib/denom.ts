export interface DenomTrace {
  baseDenom: string
  path: string
  displayName?: string
  symbol?: string
  decimals?: number
}

export interface DenomMetadata {
  denom: string
  displayName: string
  symbol: string
  decimals: number
  isIBC: boolean
  ibcHash?: string
}
