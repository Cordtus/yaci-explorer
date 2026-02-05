import { cx } from '@/styled-system/css'
import { getBech32Prefix } from '@/lib/chain-info'

// Re-export cx as cn for compatibility with existing code
export const cn = cx

export function formatAddress(address: string, length = 8): string {
  if (!address) return ''
  if (address.length <= length * 2) return address
  return `${address.slice(0, length)}...${address.slice(-length)}`
}

export function formatNumber(num: number | string, decimals = 2): string {
  const n = typeof num === 'string' ? parseFloat(num) : num
  if (Number.isNaN(n)) return '0'
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })
}

export function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString()
}

export function formatTimeAgo(timestamp: string): string {
  const now = Date.now()
  const time = new Date(timestamp).getTime()
  const diff = Math.floor((now - time) / 1000)

  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export function formatHash(hash: string, length = 10): string {
  if (!hash) return ''
  if (hash.length <= length * 2) return hash
  return `${hash.slice(0, length)}...${hash.slice(-length)}`
}

export function formatAmount(amount: string, decimals = 6, symbol = ''): string {
  const value = BigInt(amount) / BigInt(10 ** decimals)
  const formatted = formatNumber(value.toString())
  return symbol ? `${formatted} ${symbol}` : formatted
}

/**
 * Validate bech32 checksum using BCH code
 * Returns true if the checksum is valid
 */
function verifyBech32Checksum(hrp: string, data: number[]): boolean {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]
  const polymod = (values: number[]): number => {
    let chk = 1
    for (const v of values) {
      const b = chk >> 25
      chk = ((chk & 0x1ffffff) << 5) ^ v
      for (let i = 0; i < 5; i++) {
        if ((b >> i) & 1) chk ^= GEN[i]
      }
    }
    return chk
  }

  const hrpExpand = [...hrp].map(c => c.charCodeAt(0) >> 5)
    .concat([0])
    .concat([...hrp].map(c => c.charCodeAt(0) & 31))

  return polymod([...hrpExpand, ...data]) === 1
}

/**
 * Validate a bech32 address with full checksum verification
 * Returns true only if format AND checksum are valid
 */
export function isValidBech32Address(address: string): boolean {
  const lower = address.toLowerCase()
  // Basic format check: lowercase, has separator, correct charset
  // Bech32 data: 32 data chars + 6 checksum = 38 min for 20-byte addresses
  if (!/^[a-z]+1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38,}$/.test(lower)) {
    return false
  }

  const pos = lower.lastIndexOf('1')
  if (pos < 1 || pos + 7 > lower.length) return false

  const hrp = lower.slice(0, pos)
  const dataStr = lower.slice(pos + 1)

  // Decode data characters to 5-bit values
  const values: number[] = []
  for (const char of dataStr) {
    const idx = BECH32_ALPHABET.indexOf(char)
    if (idx === -1) return false
    values.push(idx)
  }

  // Verify checksum
  return verifyBech32Checksum(hrp, values)
}

export function isValidAddress(address: string): boolean {
  // EVM address: 0x + 40 hex chars
  if (/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return true
  }
  // Bech32 address with checksum validation
  return isValidBech32Address(address)
}

export type AddressType = 'cosmos' | 'evm'

/** Detect if address is bech32 (cosmos) or hex (evm) */
export function getAddressType(address: string): AddressType | null {
  if (address.match(/^[a-z]+1[a-z0-9]{38,}$/)) return 'cosmos'
  if (address.match(/^0x[a-fA-F0-9]{40}$/)) return 'evm'
  return null
}

// Bech32 character set
const BECH32_ALPHABET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'

/** Convert 5-bit groups to 8-bit bytes */
function convertBits(data: number[], fromBits: number, toBits: number, pad: boolean): number[] | null {
  let acc = 0
  let bits = 0
  const ret: number[] = []
  const maxv = (1 << toBits) - 1
  for (const value of data) {
    if (value < 0 || value >> fromBits !== 0) return null
    acc = (acc << fromBits) | value
    bits += fromBits
    while (bits >= toBits) {
      bits -= toBits
      ret.push((acc >> bits) & maxv)
    }
  }
  if (pad) {
    if (bits > 0) ret.push((acc << (toBits - bits)) & maxv)
  } else if (bits >= fromBits || ((acc << (toBits - bits)) & maxv)) {
    return null
  }
  return ret
}

/** Decode bech32 address to bytes */
function bech32Decode(addr: string): { prefix: string; bytes: Uint8Array } | null {
  const lower = addr.toLowerCase()
  const pos = lower.lastIndexOf('1')
  if (pos < 1 || pos + 7 > lower.length) return null
  const prefix = lower.slice(0, pos)
  const data = lower.slice(pos + 1)
  const values: number[] = []
  for (const char of data) {
    const idx = BECH32_ALPHABET.indexOf(char)
    if (idx === -1) return null
    values.push(idx)
  }
  // Skip checksum (last 6 chars)
  const payload = values.slice(0, -6)
  const bytes = convertBits(payload, 5, 8, false)
  if (!bytes) return null
  return { prefix, bytes: new Uint8Array(bytes) }
}

/** Encode bytes to bech32 address */
function bech32Encode(prefix: string, bytes: Uint8Array): string {
  const fiveBit = convertBits(Array.from(bytes), 8, 5, true)
  if (!fiveBit) return ''

  // Compute checksum
  const values = [...fiveBit]
  const polymod = (vals: number[]): number => {
    const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]
    let chk = 1
    for (const v of vals) {
      const b = chk >> 25
      chk = ((chk & 0x1ffffff) << 5) ^ v
      for (let i = 0; i < 5; i++) {
        if ((b >> i) & 1) chk ^= GEN[i]
      }
    }
    return chk
  }

  const prefixExpand = [...prefix].map(c => c.charCodeAt(0) >> 5)
    .concat([0])
    .concat([...prefix].map(c => c.charCodeAt(0) & 31))
  const checksum = polymod([...prefixExpand, ...values, 0, 0, 0, 0, 0, 0]) ^ 1
  const checksumChars: number[] = []
  for (let i = 0; i < 6; i++) {
    checksumChars.push((checksum >> (5 * (5 - i))) & 31)
  }

  return `${prefix}1${[...values, ...checksumChars].map(v => BECH32_ALPHABET[v]).join('')}`
}

/** Convert hex address to bech32 */
export function hexToBech32(hexAddr: string, prefix?: string): string | null {
  if (!prefix) {
    prefix = getBech32Prefix()
  }
  if (!hexAddr.match(/^0x[a-fA-F0-9]{40}$/)) return null
  const bytes = new Uint8Array(20)
  for (let i = 0; i < 20; i++) {
    bytes[i] = parseInt(hexAddr.slice(2 + i * 2, 4 + i * 2), 16)
  }
  return bech32Encode(prefix, bytes)
}

/** Convert bech32 address to hex */
export function bech32ToHex(bech32Addr: string): string | null {
  const decoded = bech32Decode(bech32Addr)
  if (!decoded || decoded.bytes.length !== 20) return null
  return `0x${Array.from(decoded.bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`
}

/** Get the alternate address format (hex<->bech32) */
export function getAlternateAddress(address: string, bech32Prefix?: string): string | null {
  if (!bech32Prefix) {
    bech32Prefix = getBech32Prefix()
  }
  const type = getAddressType(address)
  if (type === 'cosmos') return bech32ToHex(address)
  if (type === 'evm') return hexToBech32(address, bech32Prefix)
  return null
}

/**
 * Re-encode a bech32 address with a valid checksum.
 * Fixes addresses where the HRP was naively swapped without recomputing the checksum.
 * Returns null if the address format is not recognizable as bech32.
 */
export function fixBech32Address(address: string): string | null {
  // If it already validates, return as-is
  if (isValidBech32Address(address)) return address

  const lower = address.toLowerCase()
  if (!/^[a-z]+1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38,}$/.test(lower)) {
    return null
  }

  const pos = lower.lastIndexOf('1')
  if (pos < 1 || pos + 7 > lower.length) return null

  const prefix = lower.slice(0, pos)
  const dataStr = lower.slice(pos + 1)

  // Decode data chars to 5-bit values
  const values: number[] = []
  for (const char of dataStr) {
    const idx = BECH32_ALPHABET.indexOf(char)
    if (idx === -1) return null
    values.push(idx)
  }

  // Strip old checksum (last 6), convert payload to bytes
  const payload = values.slice(0, -6)
  const bytes = convertBits(payload, 5, 8, false)
  if (!bytes || bytes.length !== 20) return null

  // Re-encode with correct checksum for this prefix
  return bech32Encode(prefix, new Uint8Array(bytes))
}

/** Check if EVM address is a contract by calling eth_getCode */
export async function isEvmContract(address: string, rpcUrl: string): Promise<boolean> {
  try {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getCode',
        params: [address, 'latest'],
        id: 1
      })
    })
    const data = await res.json()
    // Empty code (0x or null) means EOA, otherwise it's a contract
    return data.result && data.result !== '0x' && data.result !== '0x0'
  } catch {
    return false
  }
}

export function isValidTxHash(hash: string): boolean {
  return /^[A-F0-9]{64}$/i.test(hash)
}

export function isValidEvmTxHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash)
}

export function isBlockHeight(input: string): boolean {
  return /^\d+$/.test(input) && parseInt(input, 10) > 0
}

export type SearchInputType = 'block_height' | 'tx_hash' | 'evm_tx_hash' | 'bech32_address' | 'evm_address' | 'unknown'

/**
 * Detect the type of search input
 * Priority: block height > tx hash > evm tx hash > bech32 address > evm address > unknown
 */
export function detectSearchInputType(input: string): SearchInputType {
  const trimmed = input.trim()

  // Block height: purely numeric
  if (isBlockHeight(trimmed)) {
    return 'block_height'
  }

  // EVM tx hash: 0x + 64 hex chars
  if (isValidEvmTxHash(trimmed)) {
    return 'evm_tx_hash'
  }

  // EVM address: 0x + 40 hex chars
  if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
    return 'evm_address'
  }

  // Cosmos tx hash: 64 hex chars (no 0x prefix)
  if (isValidTxHash(trimmed)) {
    return 'tx_hash'
  }

  // Bech32 address with full checksum validation
  if (isValidBech32Address(trimmed)) {
    return 'bech32_address'
  }

  return 'unknown'
}

export function getTransactionStatus(error: string | null): {
  label: string
  variant: 'success' | 'destructive'
} {
  if (!error) {
    return { label: 'Success', variant: 'success' }
  }
  return { label: 'Failed', variant: 'destructive' }
}

export function getMessageTypeLabel(type: string): string {
  if (!type) return 'Unknown'

  const parts = type.split('.')
  const msgType = parts[parts.length - 1]

  if (msgType.startsWith('Msg')) {
    return msgType.slice(3)
  }

  return msgType
}

export function isEVMTransaction(messages: { type?: string }[]): boolean {
  if (!messages || messages.length === 0) return false

  return messages.some((msg) => msg.type?.includes('MsgEthereumTx') || msg.type?.includes('evm'))
}

/**
 * Format fee for native cosmos transactions
 * Handles micro denoms (u prefix = 6 decimals), atto denoms (a prefix = 18 decimals)
 */
export function formatNativeFee(amount: string, denom: string): string {
  if (!amount || amount === '0') return '0'
  const value = BigInt(amount)

  // Detect decimals based on denom prefix
  let decimals = 6
  let displayDenom = denom

  if (denom.startsWith('u')) {
    decimals = 6
    displayDenom = denom.slice(1).toUpperCase()
  } else if (denom.startsWith('a')) {
    decimals = 18
    displayDenom = denom.slice(1).toUpperCase()
  }

  const divisor = BigInt(10 ** decimals)
  const wholePart = value / divisor
  const fractionalPart = value % divisor

  if (fractionalPart === BigInt(0)) {
    return `${wholePart.toLocaleString()} ${displayDenom}`
  }

  const fractionalStr = fractionalPart.toString().padStart(decimals, '0')
  const trimmed = fractionalStr.replace(/0+$/, '')
  const displayValue = trimmed ? `${wholePart}.${trimmed.slice(0, 6)}` : wholePart.toString()

  return `${displayValue} ${displayDenom}`
}

/**
 * Format fee amount in raw base units (e.g., arai)
 */
export function formatRawFee(amount: string, denom: string): string {
  if (!amount || amount === '0') return `0 ${denom}`
  return `${BigInt(amount).toLocaleString()} ${denom}`
}

interface MessageData {
  type: string
  data?: {
    from_address?: string
    to_address?: string
    amount?: { denom: string; amount: string }[] | { denom: string; amount: string }
    token?: { denom: string; amount: string }
    validator_address?: string
    delegator_address?: string
    src_validator_address?: string
    dst_validator_address?: string
    [key: string]: unknown
  }
}

/**
 * Get a short action summary for a transaction message
 * Returns a human-readable string like "Sent 100 RAI" or "Delegated to cosmos1..."
 */
export function getMessageActionSummary(message: MessageData): string | null {
  if (!message.type) return null

  const msgType = getMessageTypeLabel(message.type)
  const data = message.data

  if (!data) return null

  // Extract amount if available
  let amountStr: string | null = null
  const rawAmount = data.amount
  if (rawAmount) {
    if (Array.isArray(rawAmount) && rawAmount.length > 0) {
      const { amount, denom } = rawAmount[0]
      if (amount && denom) {
        amountStr = formatNativeFee(amount, denom)
      }
    } else if (typeof rawAmount === 'object' && 'amount' in rawAmount && 'denom' in rawAmount) {
      amountStr = formatNativeFee(rawAmount.amount, rawAmount.denom)
    }
  }

  // Handle different message types
  switch (msgType) {
    case 'Send':
      if (amountStr && data.to_address) {
        return `${amountStr} to ${formatAddress(data.to_address, 6)}`
      }
      if (amountStr) return amountStr
      break

    case 'Delegate':
      if (amountStr && data.validator_address) {
        return `${amountStr}`
      }
      if (amountStr) return amountStr
      break

    case 'Undelegate':
      if (amountStr) return `${amountStr}`
      break

    case 'BeginRedelegate':
      if (amountStr) return `${amountStr}`
      break

    case 'WithdrawDelegatorReward':
      if (data.validator_address) {
        return `from ${formatAddress(data.validator_address, 6)}`
      }
      break

    case 'Vote':
      if (data.proposal_id) {
        return `on proposal #${data.proposal_id}`
      }
      break

    case 'EthereumTx':
      if (data.value && typeof data.value === 'string') {
        const value = BigInt(data.value)
        if (value > 0) {
          return `${(Number(value) / 1e18).toFixed(4)} ETH`
        }
      }
      break

    case 'MultiSend':
      return 'multi-recipient'

    case 'CreateValidator':
    case 'EditValidator':
      if (data.moniker) {
        return String(data.moniker)
      }
      break
  }

  return null
}
