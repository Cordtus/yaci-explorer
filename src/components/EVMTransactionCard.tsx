import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronRight, Copy, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import type { EvmData } from '@/lib/api'

interface EVMTransactionCardProps {
  evmData: EvmData
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
function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) return '0'
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
function getTransactionAction(evmData: EvmData): { label: string; description: string } {
  // No input data = native transfer
  if (!evmData.data || evmData.data === '0x') {
    return {
      label: 'Native Transfer',
      description: `Transfer ${formatWei(evmData.value)} ETH`
    }
  }

  // Contract creation
  if (!evmData.to) {
    return {
      label: 'Contract Creation',
      description: 'Deploy new smart contract'
    }
  }

  // Decoded method from 4byte.directory
  if (evmData.functionName) {
    const method = evmData.functionName
    if (method === 'transfer') {
      return {
        label: 'Token Transfer',
        description: 'Transfer tokens'
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

  const gasLimit = evmData.gasLimit ? BigInt(evmData.gasLimit) : BigInt(0)
  const gasUsed = evmData.gasUsed || 0

  const gasEfficiency = gasLimit > 0 && gasUsed > 0
    ? ((gasUsed / Number(gasLimit)) * 100).toFixed(1)
    : '0'

  const transactionFee = evmData.gasPrice && gasUsed
    ? (BigInt(evmData.gasPrice) * BigInt(gasUsed)).toString()
    : '0'

  // Guard against missing required fields
  if (!evmData.hash) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">EVM Transaction Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">EVM data not available</div>
        </CardContent>
      </Card>
    )
  }

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
            <code className="text-xs">{evmData.from || 'N/A'}</code>
            {evmData.from && <CopyButton text={evmData.from} field="from" />}
          </div>
        </div>

        <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
          <span className="text-muted-foreground">To:</span>
          <div className="flex items-center gap-1">
            {evmData.to ? (
              <>
                <code className="text-xs">{evmData.to}</code>
                <CopyButton text={evmData.to} field="to" />
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
            {formatNumber(gasUsed)} / {formatNumber(Number(gasLimit))}
            <span className="text-xs text-muted-foreground ml-1">
              ({gasEfficiency}%)
            </span>
          </span>
        </div>

        {/* Gas Price */}
        <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
          <span className="text-muted-foreground">Gas Price:</span>
          <span>
            {formatGwei(evmData.gasPrice)} Gwei
            <span className="text-xs text-muted-foreground ml-1">
              ({evmData.gasPrice} wei)
            </span>
          </span>
        </div>

        {/* EIP-1559 fields */}
        {evmData.type === 2 && (
          <>
            {evmData.maxFeePerGas && (
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Max Fee:</span>
                <span>{formatGwei(evmData.maxFeePerGas)} Gwei</span>
              </div>
            )}
            {evmData.maxPriorityFeePerGas && (
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Max Priority:</span>
                <span>{formatGwei(evmData.maxPriorityFeePerGas)} Gwei</span>
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
        {evmData.data && evmData.data !== '0x' && (
          <Collapsible open={inputExpanded} onOpenChange={setInputExpanded}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              {inputExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              Input Data ({evmData.data.length / 2 - 1} bytes)
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="space-y-3">
                {/* Decoded function call */}
                {evmData.functionName && (
                  <div className="bg-muted/50 p-3 rounded text-sm space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Function:</span>
                      <Badge variant="secondary">
                        {evmData.functionName}
                      </Badge>
                    </div>
                    {evmData.functionSignature && (
                      <div className="text-xs text-muted-foreground font-mono">
                        {evmData.functionSignature}
                      </div>
                    )}
                  </div>
                )}
                {/* Raw hex data */}
                <div className="bg-muted p-3 rounded overflow-auto max-h-32">
                  <code className="text-xs break-all">{evmData.data}</code>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  )
}
