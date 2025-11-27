'use client'

import { useDenom } from '@/contexts/DenomContext'
import { formatNumber } from '@/lib/utils'
import { Copy, ArrowRight, Coins, Users, Vote, Lock } from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { css } from '@/styled-system/css'

type CoinAmount = { denom: string; amount: string }

interface MessageMetadata {
  // Bank
  amount?: CoinAmount | CoinAmount[]
  toAddress?: string
  fromAddress?: string
  inputs?: Array<{ address: string; coins: CoinAmount[] }>
  outputs?: Array<{ address: string; coins: CoinAmount[] }>

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
  title?: string
  summary?: string
  metadata?: string
  proposer?: string
  initialDeposit?: CoinAmount[]

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

interface MessageDetailsProps {
  type: string
  metadata?: MessageMetadata
  events?: Array<{
    event_type: string
    attributes: Array<{ key: string; value: string }>
  }>
}

function formatDenom(amount: string, denom: string, getDenomDisplay: (d: string) => string): string {
  const num = parseInt(amount, 10)
  if (Number.isNaN(num)) return `${amount} ${denom}`

  // For micro denoms (6 decimals)
  if (denom.startsWith('u') || denom.startsWith('ibc/')) {
    const formatted = (num / 1_000_000).toFixed(6).replace(/\.?0+$/, '')
    const display = getDenomDisplay(denom)
    return `${formatted} ${display}`
  }
  // For atto denoms (18 decimals)
  if (denom.startsWith('a')) {
    const formatted = (num / 1e18).toFixed(6).replace(/\.?0+$/, '')
    const display = getDenomDisplay(denom)
    return `${formatted} ${display}`
  }

  return `${formatNumber(num)} ${getDenomDisplay(denom)}`
}

function parseMultiDenomAmount(amountStr: string): Array<{ amount: string; denom: string }> {
  if (!amountStr) return []

  // Format: "14ibc/HASH,167403198ujuno" or "1000uatom"
  const amounts: Array<{ amount: string; denom: string }> = []
  const parts = amountStr.split(',')

  for (const part of parts) {
    const trimmed = part.trim()
    // Match number followed by denom (including ibc/ prefix)
    const match = trimmed.match(/^(\d+)(.+)$/)
    if (match) {
      amounts.push({
        amount: match[1],
        denom: match[2]
      })
    }
  }

  return amounts
}

function normalizeAmounts(amount?: CoinAmount | CoinAmount[]): CoinAmount[] {
  if (!amount) return []
  return Array.isArray(amount) ? amount : [amount]
}

function getEventAttribute(events: Array<{ event_type: string; attributes: Array<{ key: string; value: string }> }>, eventType: string, key: string): string | null {
  const event = events?.find(e => e.event_type === eventType)
  if (!event) return null

  const attr = event.attributes.find(a => a.key === key)
  return attr?.value || null
}

function DetailRow({ label, value, copyable, icon: Icon }: {
  label: string
  value: string
  copyable?: boolean
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className={css({ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '4', p: '3', bg: 'bg.muted/30', rounded: 'lg' })}>
      <div className={css({ display: 'flex', alignItems: 'center', gap: '2', minW: '0' })}>
        {Icon && <Icon className={css({ h: '4', w: '4', color: 'fg.muted', flexShrink: '0' })} />}
        <div className={css({ minW: '0' })}>
          <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'fg.muted', textTransform: 'uppercase', letterSpacing: 'wider', display: 'block' })}>
            {label}
          </label>
          <p className={css({ fontSize: 'sm', fontFamily: 'mono', wordBreak: 'break-all', mt: '1' })}>{value}</p>
        </div>
      </div>
      {copyable && (
        <Button
          variant="ghost"
          size="icon"
          className={css({ h: '6', w: '6', flexShrink: '0' })}
          onClick={() => navigator.clipboard.writeText(value)}
        >
          <Copy className={css({ h: '3', w: '3' })} />
        </Button>
      )}
    </div>
  )
}

export function MessageDetails({ type, metadata, events }: MessageDetailsProps) {
  const { getDenomDisplay } = useDenom()

  if (!metadata) return null

  // Bank Send
  if (type === '/cosmos.bank.v1beta1.MsgSend') {
    // Try to extract actual transferred amount from transfer event (more accurate than metadata)
    const transferAmountStr = getEventAttribute(events || [], 'transfer', 'amount')
    const transferAmounts = transferAmountStr ? parseMultiDenomAmount(transferAmountStr) : []
    const displayAmounts = transferAmounts.length > 0 ? transferAmounts : normalizeAmounts(metadata.amount)

    return (
      <div className={css({ display: 'flex', flexDir: 'column', gap: '2' })}>
        <div className={css({ display: 'flex', alignItems: 'center', gap: '2', mb: '3' })}>
          <Coins className={css({ h: '4', w: '4', color: 'colorPalette.default' })} />
          <span className={css({ fontSize: 'sm', fontWeight: 'semibold' })}>Token Transfer</span>
        </div>
        {metadata.fromAddress && (
          <DetailRow label="From" value={metadata.fromAddress} copyable icon={Users} />
        )}
        <div className={css({ display: 'flex', justifyContent: 'center' })}>
          <ArrowRight className={css({ h: '4', w: '4', color: 'fg.muted' })} />
        </div>
        {metadata.toAddress && (
          <DetailRow label="To" value={metadata.toAddress} copyable icon={Users} />
        )}
        {displayAmounts.length > 0 && (
          <div className={css({ p: '3', bg: 'colorPalette.a2', rounded: 'lg', borderWidth: '1px', borderColor: 'colorPalette.a5' })}>
            <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'colorPalette.default', textTransform: 'uppercase', letterSpacing: 'wider', display: 'block', mb: '2' })}>Amount</label>
            {displayAmounts.map((amt, idx) => (
              <div key={idx} className={css({ fontSize: 'lg', fontWeight: 'bold', color: 'colorPalette.default' })}>
                {formatDenom(amt.amount, amt.denom, getDenomDisplay)}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Bank MultiSend
  if (type === '/cosmos.bank.v1beta1.MsgMultiSend') {
    const inputs = metadata.inputs || []
    const outputs = metadata.outputs || []

    return (
      <div className={css({ display: 'flex', flexDir: 'column', gap: '2' })}>
        <div className={css({ display: 'flex', alignItems: 'center', gap: '2', mb: '3' })}>
          <Coins className={css({ h: '4', w: '4', color: 'colorPalette.default' })} />
          <span className={css({ fontSize: 'sm', fontWeight: 'semibold' })}>Multi-Send Transfer</span>
          <Badge variant="outline" className={css({ ml: 'auto' })}>
            {inputs.length} input{inputs.length !== 1 ? 's' : ''} / {outputs.length} output{outputs.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Inputs */}
        {inputs.length > 0 && (
          <div className={css({ p: '3', bg: 'bg.muted/30', rounded: 'lg' })}>
            <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'fg.muted', textTransform: 'uppercase', letterSpacing: 'wider', display: 'block', mb: '2' })}>
              From ({inputs.length})
            </label>
            {inputs.map((input, idx) => (
              <div key={idx} className={css({ mb: idx < inputs.length - 1 ? '2' : '0' })}>
                <p className={css({ fontSize: 'sm', fontFamily: 'mono', wordBreak: 'break-all' })}>{input.address}</p>
                <div className={css({ display: 'flex', gap: '2', flexWrap: 'wrap', mt: '1' })}>
                  {input.coins.map((coin, coinIdx) => (
                    <Badge key={coinIdx} variant="outline" className={css({ fontSize: 'xs' })}>
                      {formatDenom(coin.amount, coin.denom, getDenomDisplay)}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={css({ display: 'flex', justifyContent: 'center' })}>
          <ArrowRight className={css({ h: '4', w: '4', color: 'fg.muted' })} />
        </div>

        {/* Outputs */}
        {outputs.length > 0 && (
          <div className={css({ p: '3', bg: 'colorPalette.a2', rounded: 'lg', borderWidth: '1px', borderColor: 'colorPalette.a5' })}>
            <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'colorPalette.default', textTransform: 'uppercase', letterSpacing: 'wider', display: 'block', mb: '2' })}>
              To ({outputs.length})
            </label>
            {outputs.map((output, idx) => (
              <div key={idx} className={css({ mb: idx < outputs.length - 1 ? '3' : '0', pb: idx < outputs.length - 1 ? '3' : '0', borderBottom: idx < outputs.length - 1 ? '1px solid' : 'none', borderColor: 'colorPalette.a5' })}>
                <p className={css({ fontSize: 'sm', fontFamily: 'mono', wordBreak: 'break-all' })}>{output.address}</p>
                <div className={css({ display: 'flex', gap: '2', flexWrap: 'wrap', mt: '1' })}>
                  {output.coins.map((coin, coinIdx) => (
                    <span key={coinIdx} className={css({ fontSize: 'sm', fontWeight: 'bold', color: 'colorPalette.default' })}>
                      {formatDenom(coin.amount, coin.denom, getDenomDisplay)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Staking - Delegate
  if (type === '/cosmos.staking.v1beta1.MsgDelegate') {
    const amount = normalizeAmounts(metadata.amount)[0]
    return (
      <div className={css({ display: 'flex', flexDir: 'column', gap: '2' })}>
        <div className={css({ display: 'flex', alignItems: 'center', gap: '2', mb: '3' })}>
          <Lock className={css({ h: '4', w: '4', color: 'green.600' })} />
          <span className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'green.600' })}>Delegate Tokens</span>
        </div>
        {metadata.delegatorAddress && (
          <DetailRow label="Delegator" value={metadata.delegatorAddress} copyable icon={Users} />
        )}
        <div className={css({ display: 'flex', justifyContent: 'center' })}>
          <ArrowRight className={css({ h: '4', w: '4', color: 'fg.muted' })} />
        </div>
        {metadata.validatorAddress && (
          <DetailRow label="Validator" value={metadata.validatorAddress} copyable />
        )}
        {amount && (
          <div className={css({ p: '3', bg: 'green.500/10', rounded: 'lg', borderWidth: '1px', borderColor: 'green.500/20' })}>
            <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'green.600', textTransform: 'uppercase', letterSpacing: 'wider', display: 'block', mb: '2' })}>Staked Amount</label>
            <div className={css({ fontSize: 'lg', fontWeight: 'bold', color: 'green.600' })}>
              {formatDenom(amount.amount, amount.denom, getDenomDisplay)}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Staking - Undelegate
  if (type === '/cosmos.staking.v1beta1.MsgUndelegate') {
    const amount = normalizeAmounts(metadata.amount)[0]
    return (
      <div className={css({ display: 'flex', flexDir: 'column', gap: '2' })}>
        <div className={css({ display: 'flex', alignItems: 'center', gap: '2', mb: '3' })}>
          <Lock className={css({ h: '4', w: '4', color: 'orange.600' })} />
          <span className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'orange.600' })}>Undelegate Tokens</span>
        </div>
        {metadata.delegatorAddress && (
          <DetailRow label="Delegator" value={metadata.delegatorAddress} copyable icon={Users} />
        )}
        {metadata.validatorAddress && (
          <DetailRow label="Validator" value={metadata.validatorAddress} copyable />
        )}
        {amount && (
          <div className={css({ p: '3', bg: 'orange.500/10', rounded: 'lg', borderWidth: '1px', borderColor: 'orange.500/20' })}>
            <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'orange.600', textTransform: 'uppercase', letterSpacing: 'wider', display: 'block', mb: '2' })}>Unstaked Amount</label>
            <div className={css({ fontSize: 'lg', fontWeight: 'bold', color: 'orange.600' })}>
              {formatDenom(amount.amount, amount.denom, getDenomDisplay)}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Staking - Redelegate
  if (type === '/cosmos.staking.v1beta1.MsgBeginRedelegate') {
    const amount = normalizeAmounts(metadata.amount)[0]
    return (
      <div className={css({ display: 'flex', flexDir: 'column', gap: '2' })}>
        <div className={css({ display: 'flex', alignItems: 'center', gap: '2', mb: '3' })}>
          <Lock className={css({ h: '4', w: '4', color: 'blue.600' })} />
          <span className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'blue.600' })}>Redelegate Tokens</span>
        </div>
        {metadata.delegatorAddress && (
          <DetailRow label="Delegator" value={metadata.delegatorAddress} copyable icon={Users} />
        )}
        {metadata.validatorSrcAddress && (
          <DetailRow label="From Validator" value={metadata.validatorSrcAddress} copyable />
        )}
        <div className={css({ display: 'flex', justifyContent: 'center' })}>
          <ArrowRight className={css({ h: '4', w: '4', color: 'fg.muted' })} />
        </div>
        {metadata.validatorDstAddress && (
          <DetailRow label="To Validator" value={metadata.validatorDstAddress} copyable />
        )}
        {amount && (
          <div className={css({ p: '3', bg: 'blue.500/10', rounded: 'lg', borderWidth: '1px', borderColor: 'blue.500/20' })}>
            <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'blue.600', textTransform: 'uppercase', letterSpacing: 'wider', display: 'block', mb: '2' })}>Redelegated Amount</label>
            <div className={css({ fontSize: 'lg', fontWeight: 'bold', color: 'blue.600' })}>
              {formatDenom(amount.amount, amount.denom, getDenomDisplay)}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Distribution - Withdraw Rewards
  if (type === '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward') {
    // Extract reward amounts from withdraw_rewards event
    const rewardAmountStr = getEventAttribute(events || [], 'withdraw_rewards', 'amount')
    const rewardAmounts = rewardAmountStr ? parseMultiDenomAmount(rewardAmountStr) : []

    return (
      <div className={css({ display: 'flex', flexDir: 'column', gap: '2' })}>
        <div className={css({ display: 'flex', alignItems: 'center', gap: '2', mb: '3' })}>
          <Coins className={css({ h: '4', w: '4', color: 'purple.600' })} />
          <span className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'purple.600' })}>Claim Staking Rewards</span>
        </div>
        {metadata.delegatorAddress && (
          <DetailRow label="Delegator" value={metadata.delegatorAddress} copyable icon={Users} />
        )}
        {metadata.validatorAddress && (
          <DetailRow label="Validator" value={metadata.validatorAddress} copyable />
        )}
        {rewardAmounts.length > 0 && (
          <div className={css({ p: '3', bg: 'purple.500/10', rounded: 'lg', borderWidth: '1px', borderColor: 'purple.500/20' })}>
            <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'purple.600', textTransform: 'uppercase', letterSpacing: 'wider', display: 'block', mb: '2' })}>Rewards Claimed</label>
            {rewardAmounts.map((amt, idx) => (
              <div key={idx} className={css({ fontSize: 'lg', fontWeight: 'bold', color: 'purple.600' })}>
                {formatDenom(amt.amount, amt.denom, getDenomDisplay)}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Distribution - Withdraw Commission
  if (type === '/cosmos.distribution.v1beta1.MsgWithdrawValidatorCommission') {
    // Extract commission amounts from withdraw_commission event
    const commissionAmountStr = getEventAttribute(events || [], 'withdraw_commission', 'amount')
    const commissionAmounts = commissionAmountStr ? parseMultiDenomAmount(commissionAmountStr) : []

    return (
      <div className={css({ display: 'flex', flexDir: 'column', gap: '2' })}>
        <div className={css({ display: 'flex', alignItems: 'center', gap: '2', mb: '3' })}>
          <Coins className={css({ h: '4', w: '4', color: 'purple.600' })} />
          <span className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'purple.600' })}>Claim Validator Commission</span>
        </div>
        {metadata.validatorAddress && (
          <DetailRow label="Validator" value={metadata.validatorAddress} copyable />
        )}
        {commissionAmounts.length > 0 && (
          <div className={css({ p: '3', bg: 'purple.500/10', rounded: 'lg', borderWidth: '1px', borderColor: 'purple.500/20' })}>
            <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'purple.600', textTransform: 'uppercase', letterSpacing: 'wider', display: 'block', mb: '2' })}>Commission Claimed</label>
            {commissionAmounts.map((amt, idx) => (
              <div key={idx} className={css({ fontSize: 'lg', fontWeight: 'bold', color: 'purple.600' })}>
                {formatDenom(amt.amount, amt.denom, getDenomDisplay)}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Governance - Submit Proposal
  if (type === '/cosmos.gov.v1beta1.MsgSubmitProposal' || type === '/cosmos.gov.v1.MsgSubmitProposal') {
    const proposalId = getEventAttribute(events || [], 'submit_proposal', 'proposal_id')
    const depositAmounts = metadata.initialDeposit || []

    return (
      <div className={css({ display: 'flex', flexDir: 'column', gap: '3' })}>
        <div className={css({ display: 'flex', alignItems: 'center', gap: '2', mb: '3' })}>
          <Vote className={css({ h: '4', w: '4', color: 'indigo.600' })} />
          <span className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'indigo.600' })}>Submit Governance Proposal</span>
        </div>
        {proposalId && (
          <div className={css({ p: '3', bg: 'indigo.500/10', rounded: 'lg', borderWidth: '1px', borderColor: 'indigo.500/20' })}>
            <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'indigo.600', textTransform: 'uppercase', letterSpacing: 'wider', display: 'block', mb: '1' })}>Proposal ID</label>
            <div className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'indigo.600' })}>#{proposalId}</div>
          </div>
        )}
        {metadata.title && (
          <div className={css({ p: '3', bg: 'bg.muted/30', rounded: 'lg' })}>
            <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'fg.muted', textTransform: 'uppercase', letterSpacing: 'wider', display: 'block', mb: '1' })}>Title</label>
            <div className={css({ fontSize: 'base', fontWeight: 'semibold' })}>{metadata.title}</div>
          </div>
        )}
        {metadata.summary && (
          <div className={css({ p: '3', bg: 'bg.muted/30', rounded: 'lg' })}>
            <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'fg.muted', textTransform: 'uppercase', letterSpacing: 'wider', display: 'block', mb: '1' })}>Summary</label>
            <div className={css({ fontSize: 'sm', whiteSpace: 'pre-wrap' })}>{metadata.summary}</div>
          </div>
        )}
        {metadata.proposer && (
          <DetailRow label="Proposer" value={metadata.proposer} copyable icon={Users} />
        )}
        {depositAmounts.length > 0 && (
          <div className={css({ p: '3', bg: 'green.500/10', rounded: 'lg', borderWidth: '1px', borderColor: 'green.500/20' })}>
            <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'green.600', textTransform: 'uppercase', letterSpacing: 'wider', display: 'block', mb: '2' })}>Initial Deposit</label>
            {depositAmounts.map((amt, idx) => (
              <div key={idx} className={css({ fontSize: 'lg', fontWeight: 'bold', color: 'green.600' })}>
                {formatDenom(amt.amount, amt.denom, getDenomDisplay)}
              </div>
            ))}
          </div>
        )}
        {metadata.metadata && (
          <div className={css({ p: '3', bg: 'bg.muted/30', rounded: 'lg' })}>
            <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'fg.muted', textTransform: 'uppercase', letterSpacing: 'wider', display: 'block', mb: '1' })}>Metadata</label>
            <div className={css({ fontSize: 'sm', fontFamily: 'mono', wordBreak: 'break-all' })}>{metadata.metadata}</div>
          </div>
        )}
      </div>
    )
  }

  // Governance - Vote
  if (type === '/cosmos.gov.v1beta1.MsgVote' || type === '/cosmos.gov.v1.MsgVote') {
    return (
      <div className={css({ display: 'flex', flexDir: 'column', gap: '2' })}>
        <div className={css({ display: 'flex', alignItems: 'center', gap: '2', mb: '3' })}>
          <Vote className={css({ h: '4', w: '4', color: 'indigo.600' })} />
          <span className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'indigo.600' })}>Governance Vote</span>
        </div>
        {metadata.proposalId && (
          <div className={css({ p: '3', bg: 'indigo.500/10', rounded: 'lg', borderWidth: '1px', borderColor: 'indigo.500/20' })}>
            <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'indigo.600', textTransform: 'uppercase', letterSpacing: 'wider', display: 'block', mb: '2' })}>Proposal ID</label>
            <div className={css({ fontSize: 'lg', fontWeight: 'bold', color: 'indigo.600' })}>#{metadata.proposalId}</div>
          </div>
        )}
        {metadata.voter && (
          <DetailRow label="Voter" value={metadata.voter} copyable icon={Users} />
        )}
        {metadata.option && (
          <div className={css({ p: '3', bg: 'bg.muted/30', rounded: 'lg' })}>
            <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'fg.muted', textTransform: 'uppercase', letterSpacing: 'wider', display: 'block', mb: '2' })}>Vote</label>
            <Badge variant="outline" className={css({ fontSize: 'sm' })}>{metadata.option}</Badge>
          </div>
        )}
      </div>
    )
  }

  // IBC Transfer
  if (type === '/ibc.applications.transfer.v1.MsgTransfer') {
    // Try to get actual sent amount from send_packet or transfer event
    const sendPacketAmount = getEventAttribute(events || [], 'send_packet', 'packet_data_hex')
    const transferAmountStr = getEventAttribute(events || [], 'transfer', 'amount')
    const transferAmounts = transferAmountStr ? parseMultiDenomAmount(transferAmountStr) : []

    // Fallback to metadata token if event data not available
    const displayAmounts = transferAmounts.length > 0
      ? transferAmounts
      : (metadata.token ? [metadata.token] : normalizeAmounts(metadata.amount))

    return (
      <div className={css({ display: 'flex', flexDir: 'column', gap: '2' })}>
        <div className={css({ display: 'flex', alignItems: 'center', gap: '2', mb: '3' })}>
          <ArrowRight className={css({ h: '4', w: '4', color: 'cyan.600' })} />
          <span className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'cyan.600' })}>IBC Transfer</span>
        </div>
        {metadata.sender && (
          <DetailRow label="Sender" value={metadata.sender} copyable icon={Users} />
        )}
        <div className={css({ display: 'flex', justifyContent: 'center' })}>
          <ArrowRight className={css({ h: '4', w: '4', color: 'fg.muted' })} />
        </div>
        {metadata.receiver && (
          <DetailRow label="Receiver" value={metadata.receiver} copyable icon={Users} />
        )}
        {metadata.sourceChannel && (
          <DetailRow label="Channel" value={`${metadata.sourcePort}/${metadata.sourceChannel}`} />
        )}
        {displayAmounts.length > 0 && (
          <div className={css({ p: '3', bg: 'cyan.500/10', rounded: 'lg', borderWidth: '1px', borderColor: 'cyan.500/20' })}>
            <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'cyan.600', textTransform: 'uppercase', letterSpacing: 'wider', display: 'block', mb: '2' })}>Amount</label>
            {displayAmounts.map((amt, idx) => (
              <div key={idx} className={css({ fontSize: 'lg', fontWeight: 'bold', color: 'cyan.600' })}>
                {formatDenom(amt.amount, amt.denom, getDenomDisplay)}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // CosmWasm - Execute Contract
  if (type === '/cosmwasm.wasm.v1.MsgExecuteContract') {
    let decodedMsg = null
    if (metadata.msg) {
      try {
        const decoded = atob(metadata.msg)
        decodedMsg = JSON.parse(decoded)
      } catch (e) {
        // Ignore decode errors
      }
    }

    // Extract any funds sent with contract execution
    const transferAmountStr = getEventAttribute(events || [], 'transfer', 'amount')
    const transferAmounts = transferAmountStr ? parseMultiDenomAmount(transferAmountStr) : []

    // Extract wasm events for contract-specific actions
    const wasmEvents = events?.filter(e => e.event_type === 'wasm') || []

    return (
      <div className={css({ display: 'flex', flexDir: 'column', gap: '2' })}>
        <div className={css({ display: 'flex', alignItems: 'center', gap: '2', mb: '3' })}>
          <Code className={css({ h: '4', w: '4', color: 'teal.600' })} />
          <span className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'teal.600' })}>Execute Smart Contract</span>
        </div>
        {metadata.contract && (
          <DetailRow label="Contract" value={metadata.contract} copyable />
        )}
        {metadata.sender && (
          <DetailRow label="Sender" value={metadata.sender} copyable icon={Users} />
        )}
        {transferAmounts.length > 0 && (
          <div className={css({ p: '3', bg: 'teal.500/10', rounded: 'lg', borderWidth: '1px', borderColor: 'teal.500/20' })}>
            <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'teal.600', textTransform: 'uppercase', letterSpacing: 'wider', display: 'block', mb: '2' })}>Funds Sent</label>
            {transferAmounts.map((amt, idx) => (
              <div key={idx} className={css({ fontSize: 'lg', fontWeight: 'bold', color: 'teal.600' })}>
                {formatDenom(amt.amount, amt.denom, getDenomDisplay)}
              </div>
            ))}
          </div>
        )}
        {decodedMsg && (
          <div className={css({ p: '3', bg: 'bg.muted/30', rounded: 'lg' })}>
            <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'fg.muted', textTransform: 'uppercase', letterSpacing: 'wider', display: 'block', mb: '2' })}>Contract Message</label>
            <pre className={css({ fontSize: 'xs', fontFamily: 'mono', overflow: 'auto', maxH: '32', mt: '1' })}>
              {JSON.stringify(decodedMsg, null, 2)}
            </pre>
          </div>
        )}
        {wasmEvents.length > 0 && (
          <div className={css({ p: '3', bg: 'bg.muted/30', rounded: 'lg' })}>
            <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'fg.muted', textTransform: 'uppercase', letterSpacing: 'wider', display: 'block', mb: '2' })}>Contract Events</label>
            {wasmEvents.map((event, idx) => (
              <div key={idx} className={css({ fontSize: 'xs', fontFamily: 'mono', mb: '2' })}>
                {event.attributes.map((attr, attrIdx) => (
                  <div key={attrIdx} className={css({ display: 'flex', gap: '2' })}>
                    <span className={css({ color: 'fg.muted' })}>{attr.key}:</span>
                    <span>{attr.value}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Authz - Execute
  if (type === '/cosmos.authz.v1beta1.MsgExec') {
    const innerMsgs = metadata.msgs || []
    return (
      <div className={css({ display: 'flex', flexDir: 'column', gap: '2' })}>
        <div className={css({ display: 'flex', alignItems: 'center', gap: '2', mb: '3' })}>
          <Users className={css({ h: '4', w: '4', color: 'pink.600' })} />
          <span className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'pink.600' })}>Execute Authorized Action</span>
        </div>
        {metadata.grantee && (
          <DetailRow label="Grantee (Executor)" value={metadata.grantee} copyable icon={Users} />
        )}
        {innerMsgs.length > 0 && (
          <div className={css({ p: '3', bg: 'pink.500/10', rounded: 'lg', borderWidth: '1px', borderColor: 'pink.500/20' })}>
            <label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'pink.600', textTransform: 'uppercase', letterSpacing: 'wider', display: 'block', mb: '2' })}>
              Executing {innerMsgs.length} Authorized {innerMsgs.length === 1 ? 'Message' : 'Messages'}
            </label>
            {innerMsgs.map((msg: any, idx: number) => (
              <Badge key={idx} variant="outline" className={css({ mr: '2', mt: '1' })}>
                {msg['@type']?.split('.').pop() || 'Unknown'}
              </Badge>
            ))}
          </div>
        )}
      </div>
    )
  }

  return null
}

function Code({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Code icon">
      <title>Code</title>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  )
}
