import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronRight, Copy, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import type { EVMTransaction } from '@yaci/database-client'

interface EVMTransactionCardProps {
  evmData: EVMTransaction
}

// Format wei to ether with appropriate decimals
function formatWei(wei: string, decimals = 18): string {
  if (!wei || wei === '0') return '0'
  const value = BigInt(wei)
  const divisor = BigInt(10 ** decimals)
  const wholePart = value / divisor
  const fractionalPart = value % divisor

  if (fractionalPart === BigInt(0)) {
    return wholePart.toString()
  }

  const fractionalStr = fractionalPart.toString().padStart(decimals, '0')
  const trimmed = fractionalStr.replace(/0+$/, '')
  return trimmed ? `${wholePart}.${trimmed}` : wholePart.toString()
}

// Format gas price from wei to gwei
function formatGwei(wei: string): string {
  if (!wei) return '0'
  const value = BigInt(wei)
  const gwei = Number(value) / 1e9
  return gwei.toFixed(2)
}

// Format large numbers with commas
function formatNumber(num: number): string {
  return num.toLocaleString()
}

// Get transaction type label
function getTxTypeLabel(type: number): string {
  switch (type) {
    case 0: return 'Legacy'
    case 1: return 'Access List (EIP-2930)'
    case 2: return 'Dynamic Fee (EIP-1559)'
    default: return `Type ${type}`
  }
}

// Determine transaction action based on input data and decoded info
function getTransactionAction(evmData: EVMTransaction): { label: string; description: string } {
  // No input data = native transfer
  if (!evmData.input_data || evmData.input_data === '0x') {
    return {
      label: 'Native Transfer',
      description: `Transfer ${formatWei(evmData.value)} ETH`
    }
  }

  // Contract creation
  if (!evmData.to_address) {
    return {
      label: 'Contract Creation',
      description: 'Deploy new smart contract'
    }
  }

  // Decoded method
  if (evmData.decoded_input) {
    const method = evmData.decoded_input.methodName
    if (method === 'transfer') {
      const to = evmData.decoded_input.params.find(p => p.name === 'to')?.value
      const amount = evmData.decoded_input.params.find(p => p.name === 'amount')?.value
      return {
        label: 'Token Transfer',
        description: amount ? `Transfer ${formatWei(String(amount))} tokens` : 'Transfer tokens'
      }
    }
    if (method === 'approve') {
      return {
        label: 'Token Approval',
        description: 'Approve spender allowance'
      }
    }
    return {
      label: method.charAt(0).toUpperCase() + method.slice(1),
      description: `Call ${method}() function`
    }
  }

  return {
    label: 'Contract Interaction',
    description: 'Execute contract method'
  }
}

export function EVMTransactionCard({ evmData }: EVMTransactionCardProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const [inputExpanded, setInputExpanded] = useState(false)

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <Button
      variant="ghost"
      size="icon"
      className="h-5 w-5"
      onClick={() => copyToClipboard(text, field)}
    >
      {copied === field ? (
        <CheckCircle className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </Button>
  )

  const gasEfficiency = evmData.gas_limit > 0
    ? ((evmData.gas_used / evmData.gas_limit) * 100).toFixed(1)
    : '0'

  const transactionFee = evmData.gas_price && evmData.gas_used
    ? (BigInt(evmData.gas_price) * BigInt(evmData.gas_used)).toString()
    : '0'

  const action = getTransactionAction(evmData)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">EVM Transaction Details</CardTitle>
          <Badge variant={evmData.status === 1 ? 'success' : 'destructive'}>
            {evmData.status === 1 ? 'Success' : 'Failed'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Transaction Summary */}
        <div className="bg-muted/50 p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-lg">{action.label}</div>
              <div className="text-sm text-muted-foreground">{action.description}</div>
            </div>
            <div className="text-right">
              <div className="font-mono font-medium">
                {formatWei(evmData.value)} ETH
              </div>
              <div className="text-xs text-muted-foreground">
                Fee: {formatWei(transactionFee)} ETH
              </div>
            </div>
          </div>
        </div>
        {/* Transaction Hash */}
        <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
          <span className="text-muted-foreground">EVM Hash:</span>
          <div className="flex items-center gap-1">
            <code className="text-xs break-all">{evmData.hash}</code>
            <CopyButton text={evmData.hash} field="hash" />
          </div>
        </div>

        {/* Transaction Type */}
        <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
          <span className="text-muted-foreground">Type:</span>
          <Badge variant="outline" className="w-fit text-xs">
            {getTxTypeLabel(evmData.type)}
          </Badge>
        </div>

        {/* From/To */}
        <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
          <span className="text-muted-foreground">From:</span>
          <div className="flex items-center gap-1">
            <code className="text-xs">{evmData.from_address || 'N/A'}</code>
            {evmData.from_address && <CopyButton text={evmData.from_address} field="from" />}
          </div>
        </div>

        <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
          <span className="text-muted-foreground">To:</span>
          <div className="flex items-center gap-1">
            {evmData.to_address ? (
              <>
                <code className="text-xs">{evmData.to_address}</code>
                <CopyButton text={evmData.to_address} field="to" />
              </>
            ) : (
              <span className="text-muted-foreground italic">Contract Creation</span>
            )}
          </div>
        </div>

        {/* Value */}
        <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
          <span className="text-muted-foreground">Value:</span>
          <span className="font-medium">
            {formatWei(evmData.value)} ETH
            {evmData.value !== '0' && (
              <span className="text-xs text-muted-foreground ml-1">
                ({evmData.value} wei)
              </span>
            )}
          </span>
        </div>

        {/* Transaction Fee */}
        <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
          <span className="text-muted-foreground">Tx Fee:</span>
          <span className="font-medium">
            {formatWei(transactionFee)} ETH
          </span>
        </div>

        {/* Gas */}
        <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
          <span className="text-muted-foreground">Gas Used:</span>
          <span>
            {formatNumber(evmData.gas_used)} / {formatNumber(evmData.gas_limit)}
            <span className="text-xs text-muted-foreground ml-1">
              ({gasEfficiency}%)
            </span>
          </span>
        </div>

        {/* Gas Price */}
        <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
          <span className="text-muted-foreground">Gas Price:</span>
          <span>
            {formatGwei(evmData.gas_price)} Gwei
            <span className="text-xs text-muted-foreground ml-1">
              ({evmData.gas_price} wei)
            </span>
          </span>
        </div>

        {/* EIP-1559 fields */}
        {evmData.type === 2 && (
          <>
            {evmData.max_fee_per_gas && (
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Max Fee:</span>
                <span>{formatGwei(evmData.max_fee_per_gas)} Gwei</span>
              </div>
            )}
            {evmData.max_priority_fee_per_gas && (
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Max Priority:</span>
                <span>{formatGwei(evmData.max_priority_fee_per_gas)} Gwei</span>
              </div>
            )}
          </>
        )}

        {/* Nonce */}
        <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
          <span className="text-muted-foreground">Nonce:</span>
          <span>{evmData.nonce}</span>
        </div>

        {/* Input Data */}
        {evmData.input_data && evmData.input_data !== '0x' && (
          <Collapsible open={inputExpanded} onOpenChange={setInputExpanded}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              {inputExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              Input Data ({evmData.input_data.length / 2 - 1} bytes)
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="space-y-3">
                {/* Decoded function call */}
                {evmData.decoded_input && (
                  <div className="bg-muted/50 p-3 rounded text-sm space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Function:</span>
                      <Badge variant="secondary">
                        {evmData.decoded_input.methodName}
                      </Badge>
                      <code className="text-xs text-muted-foreground">
                        {evmData.decoded_input.methodId}
                      </code>
                    </div>
                    {evmData.decoded_input.params.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Parameters:</span>
                        {evmData.decoded_input.params.map((param, idx) => (
                          <div key={idx} className="pl-2 text-xs font-mono">
                            <span className="text-muted-foreground">{param.type}</span>{' '}
                            <span className="text-primary">{param.name}</span>:{' '}
                            <span className="break-all">{String(param.value)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {/* Raw hex data */}
                <div className="bg-muted p-3 rounded overflow-auto max-h-32">
                  <code className="text-xs break-all">{evmData.input_data}</code>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}


        {/* Access List */}
        {evmData.access_list && evmData.access_list.length > 0 && (
          <div className="text-sm">
            <span className="text-muted-foreground">Access List:</span>
            <div className="mt-1 bg-muted p-2 rounded text-xs">
              {evmData.access_list.map((entry, idx) => (
                <div key={idx} className="mb-1">
                  <code>{entry.address}</code>
                  {entry.storage_keys.length > 0 && (
                    <span className="text-muted-foreground ml-1">
                      ({entry.storage_keys.length} keys)
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
