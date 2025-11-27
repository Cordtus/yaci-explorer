import { cx } from '@/styled-system/css'

// Re-export cx as cn for compatibility with existing code
export const cn = cx

export function formatAddress(address: string, length = 8): string {
  if (!address) return ''
  if (address.length <= length * 2) return address
  return `${address.slice(0, length)}...${address.slice(-length)}`
}

export function formatNumber(num: number | string, decimals = 2): string {
  const n = typeof num === 'string' ? parseFloat(num) : num
  if (isNaN(n)) return '0'
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

export function isValidAddress(address: string): boolean {
  if (address.match(/^[a-z]+1[a-z0-9]{38,}$/)) {
    return true
  }
  if (address.match(/^0x[a-fA-F0-9]{40}$/)) {
    return true
  }
  return false
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

  return prefix + '1' + [...values, ...checksumChars].map(v => BECH32_ALPHABET[v]).join('')
}

/** Convert hex address to bech32 */
export function hexToBech32(hexAddr: string, prefix = 'republic'): string | null {
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
  return '0x' + Array.from(decoded.bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Get the alternate address format (hex<->bech32) */
export function getAlternateAddress(address: string, bech32Prefix = 'republic'): string | null {
  const type = getAddressType(address)
  if (type === 'cosmos') return bech32ToHex(address)
  if (type === 'evm') return hexToBech32(address, bech32Prefix)
  return null
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
