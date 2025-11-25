import { cx } from '@/styled-system/css'

export function cn(...inputs: Array<string | undefined | false | null>) {
  return cx(...(inputs.filter(Boolean) as string[]))
}

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
    maximumFractionDigits: decimals
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
  // Check for Cosmos address (bech32)
  if (address.match(/^[a-z]+1[a-z0-9]{38,}$/)) {
    return true
  }

  // Check for EVM address
  if (address.match(/^0x[a-fA-F0-9]{40}$/)) {
    return true
  }

  return false
}

export function isValidTxHash(hash: string): boolean {
  return /^[A-F0-9]{64}$/i.test(hash)
}

export function getTransactionStatus(error: string | null): {
  label: string
  className: string
} {
  if (!error) {
    return {
      label: 'Success',
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    }
  }
  return {
    label: 'Failed',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }
}

export function getMessageTypeLabel(type: string): string {
  if (!type) return 'Unknown'

  // Remove the module path and just return the message type
  const parts = type.split('.')
  const msgType = parts[parts.length - 1]

  // Convert from MsgSend to Send
  if (msgType.startsWith('Msg')) {
    return msgType.slice(3)
  }

  return msgType
}

export function isEVMTransaction(messages: any[]): boolean {
  if (!messages || messages.length === 0) return false

  return messages.some(msg =>
    msg.type?.includes('MsgEthereumTx') ||
    msg.type?.includes('evm')
  )
}
