import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronRight, Copy, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { Link } from 'react-router'
import type { EvmData } from '@/lib/api'
import { css } from '@/styled-system/css'
import { formatTimeAgo } from '@/lib/utils'

interface EVMTransactionCardProps {
  evmData: EvmData
  blockHeight?: number
  timestamp?: string
}

// Format wei to native token with appropriate decimals
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
      description: `Transfer ${formatWei(evmData.value)} RAI`
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

export function EVMTransactionCard({ evmData, blockHeight, timestamp }: EVMTransactionCardProps) {
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
      className={css({ h: '5', w: '5' })}
      onClick={() => copyToClipboard(text, field)}
    >
      {copied === field ? (
        <CheckCircle className={css({ h: '3', w: '3', color: 'green.500' })} />
      ) : (
        <Copy className={css({ h: '3', w: '3' })} />
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
          <CardTitle className={css({ fontSize: 'lg' })}>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={css({ color: 'fg.muted' })}>EVM data not available</div>
        </CardContent>
      </Card>
    )
  }

  const action = getTransactionAction(evmData)

  return (
    <Card>
      <CardHeader>
        <div className={css({ display: 'flex', alignItems: 'center', justifyContent: 'space-between' })}>
          <CardTitle className={css({ fontSize: 'lg' })}>Details</CardTitle>
          <Badge variant={evmData.status === 1 ? 'success' : 'destructive'}>
            {evmData.status === 1 ? 'Success' : 'Failed'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className={css({ display: 'flex', flexDir: 'column', gap: '4' })}>
        {/* Transaction Summary */}
        <div className={css({ bg: 'bg.muted', opacity: '0.5', p: '4', rounded: 'lg', borderWidth: '1px', borderColor: 'border.default' })}>
          <div className={css({ display: 'flex', alignItems: 'center', justifyContent: 'space-between' })}>
            <div>
              <div className={css({ fontWeight: 'medium', fontSize: 'lg' })}>{action.label}</div>
              <div className={css({ fontSize: 'sm', color: 'fg.muted' })}>{action.description}</div>
            </div>
            <div className={css({ textAlign: 'right' })}>
              <div className={css({ fontFamily: 'mono', fontWeight: 'medium' })}>
                {formatWei(evmData.value)} RAI
              </div>
              <div className={css({ fontSize: 'xs', color: 'fg.muted' })}>
                Fee: {formatWei(transactionFee)} RAI
              </div>
            </div>
          </div>
        </div>
        {/* Transaction Hash */}
        <div className={css({ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '2', fontSize: 'sm' })}>
          <span className={css({ color: 'fg.muted' })}>EVM Hash:</span>
          <div className={css({ display: 'flex', alignItems: 'center', gap: '1' })}>
            <code className={css({ fontSize: 'xs', wordBreak: 'break-all' })}>{evmData.hash}</code>
            <CopyButton text={evmData.hash} field="hash" />
          </div>
        </div>

        {/* Block */}
        {blockHeight && (
          <div className={css({ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '2', fontSize: 'sm' })}>
            <span className={css({ color: 'fg.muted' })}>Block:</span>
            <Link to={`/blocks/${blockHeight}`} className={css({ fontSize: 'xs', fontFamily: 'mono', color: 'accent.default', _hover: { textDecoration: 'underline' } })}>
              #{formatNumber(blockHeight)}
            </Link>
          </div>
        )}

        {/* Timestamp */}
        {timestamp && (
          <div className={css({ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '2', fontSize: 'sm' })}>
            <span className={css({ color: 'fg.muted' })}>Timestamp:</span>
            <div className={css({ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1' })}>
              <span className={css({ fontSize: 'xs' })}>{formatTimeAgo(timestamp)}</span>
              <span className={css({ fontSize: 'xs', color: 'fg.muted' })}>
                ({new Date(timestamp).toLocaleString()})
              </span>
            </div>
          </div>
        )}

        {/* Transaction Type */}
        <div className={css({ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '2', fontSize: 'sm' })}>
          <span className={css({ color: 'fg.muted' })}>Type:</span>
          <Badge variant="outline" className={css({ w: 'fit', fontSize: 'xs' })}>
            {getTxTypeLabel(evmData.type)}
          </Badge>
        </div>

        {/* From/To */}
        <div className={css({ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '2', fontSize: 'sm' })}>
          <span className={css({ color: 'fg.muted' })}>From:</span>
          <div className={css({ display: 'flex', alignItems: 'center', gap: '1' })}>
            {evmData.from ? (
              <>
                <Link to={`/addr/${evmData.from}`} className={css({ fontSize: 'xs', fontFamily: 'mono', color: 'accent.default', _hover: { textDecoration: 'underline' } })}>
                  {evmData.from}
                </Link>
                <CopyButton text={evmData.from} field="from" />
              </>
            ) : (
              <span className={css({ fontSize: 'xs' })}>N/A</span>
            )}
          </div>
        </div>

        <div className={css({ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '2', fontSize: 'sm' })}>
          <span className={css({ color: 'fg.muted' })}>To:</span>
          <div className={css({ display: 'flex', alignItems: 'center', gap: '1' })}>
            {evmData.to ? (
              <>
                <Link to={`/addr/${evmData.to}`} className={css({ fontSize: 'xs', fontFamily: 'mono', color: 'accent.default', _hover: { textDecoration: 'underline' } })}>
                  {evmData.to}
                </Link>
                <CopyButton text={evmData.to} field="to" />
              </>
            ) : (
              <span className={css({ color: 'fg.muted', fontStyle: 'italic' })}>Contract Creation</span>
            )}
          </div>
        </div>

        {/* Value */}
        <div className={css({ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '2', fontSize: 'sm' })}>
          <span className={css({ color: 'fg.muted' })}>Value:</span>
          <span className={css({ fontWeight: 'medium' })}>
            {formatWei(evmData.value)} RAI
            {evmData.value !== '0' && (
              <span className={css({ fontSize: 'xs', color: 'fg.muted', ml: '1' })}>
                ({evmData.value} wei)
              </span>
            )}
          </span>
        </div>

        {/* Transaction Fee */}
        <div className={css({ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '2', fontSize: 'sm' })}>
          <span className={css({ color: 'fg.muted' })}>Tx Fee:</span>
          <span className={css({ fontWeight: 'medium' })}>
            {formatWei(transactionFee)} RAI
          </span>
        </div>

        {/* Gas */}
        <div className={css({ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '2', fontSize: 'sm' })}>
          <span className={css({ color: 'fg.muted' })}>Gas Used:</span>
          <span>
            {formatNumber(gasUsed)} / {formatNumber(Number(gasLimit))}
            <span className={css({ fontSize: 'xs', color: 'fg.muted', ml: '1' })}>
              ({gasEfficiency}%)
            </span>
          </span>
        </div>

        {/* Gas Price */}
        <div className={css({ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '2', fontSize: 'sm' })}>
          <span className={css({ color: 'fg.muted' })}>Gas Price:</span>
          <span>
            {formatGwei(evmData.gasPrice)} Gwei
            <span className={css({ fontSize: 'xs', color: 'fg.muted', ml: '1' })}>
              ({evmData.gasPrice} wei)
            </span>
          </span>
        </div>

        {/* EIP-1559 Gas Fees */}
        {evmData.type === 2 && (evmData.maxFeePerGas || evmData.maxPriorityFeePerGas) && (
          <div className={css({ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '2', fontSize: 'sm' })}>
            <span className={css({ color: 'fg.muted' })}>Gas Fees:</span>
            <div className={css({ display: 'flex', flexDir: 'column', gap: '1' })}>
              {evmData.maxFeePerGas && (
                <div className={css({ display: 'flex', gap: '1', alignItems: 'center' })}>
                  <span className={css({ fontSize: 'xs', color: 'fg.muted', w: '16' })}>Max:</span>
                  <span className={css({ fontSize: 'xs' })}>{formatGwei(evmData.maxFeePerGas)} Gwei</span>
                </div>
              )}
              {evmData.maxPriorityFeePerGas && (
                <div className={css({ display: 'flex', gap: '1', alignItems: 'center' })}>
                  <span className={css({ fontSize: 'xs', color: 'fg.muted', w: '16' })}>Priority:</span>
                  <span className={css({ fontSize: 'xs' })}>{formatGwei(evmData.maxPriorityFeePerGas)} Gwei</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Nonce */}
        <div className={css({ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '2', fontSize: 'sm' })}>
          <span className={css({ color: 'fg.muted' })}>Nonce:</span>
          <span>{evmData.nonce}</span>
        </div>

        {/* Input Data */}
        {evmData.data && evmData.data !== '0x' && (
          <Collapsible open={inputExpanded} onOpenChange={setInputExpanded}>
            <CollapsibleTrigger className={css({ display: 'flex', alignItems: 'center', gap: '2', fontSize: 'sm', color: 'fg.muted', _hover: { color: 'fg.default' } })}>
              {inputExpanded ? <ChevronDown className={css({ h: '4', w: '4' })} /> : <ChevronRight className={css({ h: '4', w: '4' })} />}
              Input Data ({evmData.data.length / 2 - 1} bytes)
            </CollapsibleTrigger>
            <CollapsibleContent className={css({ mt: '2' })}>
              <div className={css({ display: 'flex', flexDir: 'column', gap: '3' })}>
                {/* Decoded function call */}
                {evmData.functionName && (
                  <div className={css({ bg: 'bg.muted', opacity: '0.5', p: '3', rounded: 'md', fontSize: 'sm', display: 'flex', flexDir: 'column', gap: '2' })}>
                    <div className={css({ display: 'flex', alignItems: 'center', gap: '2' })}>
                      <span className={css({ color: 'fg.muted' })}>Function:</span>
                      <Badge variant="secondary">
                        {evmData.functionName}
                      </Badge>
                    </div>
                    {evmData.functionSignature && (
                      <div className={css({ fontSize: 'xs', color: 'fg.muted', fontFamily: 'mono' })}>
                        {evmData.functionSignature}
                      </div>
                    )}
                  </div>
                )}
                {/* Raw hex data */}
                <div className={css({ bg: 'bg.muted', p: '3', rounded: 'md', overflowX: 'auto', maxH: '32' })}>
                  <code className={css({ fontSize: 'xs', wordBreak: 'break-all' })}>{evmData.data}</code>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  )
}
