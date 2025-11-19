export type CoinAmount = { denom: string; amount: string }

export interface MessageMetadata {
  // Bank
  amount?: CoinAmount | CoinAmount[]
  toAddress?: string
  fromAddress?: string

  // Staking
  delegatorAddress?: string
  validatorAddress?: string
  validatorSrcAddress?: string
  validatorDstAddress?: string

  // Distribution
  withdrawAddress?: string

  // Governance
  proposalId?: string
  voter?: string
  option?: string

  // IBC
  token?: { denom: string; amount: string }
  receiver?: string
  sender?: string
  sourceChannel?: string
  sourcePort?: string
  destinationChannel?: string
  destinationPort?: string

  // CosmWasm
  contract?: string
  msg?: string

  // Authz
  grantee?: string
  granter?: string
  msgs?: Array<any>
}

export interface MessageDetailsProps {
  type: string
  metadata?: MessageMetadata
  events?: Array<{
    event_type: string
    attributes: Array<{ key: string; value: string }>
  }>
}
