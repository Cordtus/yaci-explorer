import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, Copy, CheckCircle, XCircle, Code, Eye, ChevronDown, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { YaciAPIClient } from '@yaci/database-client'
import { formatNumber, formatTimeAgo, formatHash } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { MessageDetails } from '@/components/MessageDetails'
import { JsonViewer } from '@/components/JsonViewer'

const api = new YaciAPIClient(import.meta.env.VITE_POSTGREST_URL)

// Helper to group events by event_index, then by attributes
function groupEvents(events: any[]) {
  const grouped = new Map<number, { event_type: string; msg_index: number | null; attributes: Map<string, string> }>()

  events.forEach(event => {
    if (!grouped.has(event.event_index)) {
      grouped.set(event.event_index, {
        event_type: event.event_type,
        msg_index: event.msg_index,
        attributes: new Map()
      })
    }
    const eventGroup = grouped.get(event.event_index)!
    if (event.attr_key && event.attr_value !== null) {
      eventGroup.attributes.set(event.attr_key, event.attr_value)
    }
  })

  return Array.from(grouped.entries()).map(([index, data]) => ({
    event_index: index,
    event_type: data.event_type,
    msg_index: data.msg_index,
    attributes: Array.from(data.attributes.entries()).map(([key, value]) => ({ key, value }))
  }))
}

// Accent colors for different message types
const MESSAGE_COLORS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-green-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-indigo-500',
  'bg-teal-500',
]

// Helper to check if a string is valid JSON
function isJsonString(str: string): boolean {
  try {
    const parsed = JSON.parse(str)
    return typeof parsed === 'object' && parsed !== null
  } catch {
    return false
  }
}

export default function TransactionDetailPage() {
  const [mounted, setMounted] = useState(false)
  const [showRawData, setShowRawData] = useState<Record<number, boolean>>({})
  const [copied, setCopied] = useState(false)
  const [expandedMessages, setExpandedMessages] = useState<Record<number, boolean>>({})
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({})
  const params = useParams()

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: transaction, isLoading, error } = useQuery({
    queryKey: ['transaction', params.hash],
    queryFn: async () => {
      const result = await api.getTransaction(params.hash!)
      return result
    },
    enabled: mounted && !!params.hash,
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleRawData = (messageIndex: number) => {
    setShowRawData(prev => ({
      ...prev,
      [messageIndex]: !prev[messageIndex]
    }))
  }

  if (mounted && error) {
    return (
      <div className="space-y-4">
        <Link to="/transactions" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Transactions
        </Link>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-red-600 mb-2">Transaction Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The requested transaction could not be found.
              </p>
              <p className="text-sm text-red-500">{String(error)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!mounted || isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!transaction) {
    return null
  }

  const isSuccess = !transaction.error
  const feeAmounts = transaction.fee?.amount ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link to="/transactions" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Transactions
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">Transaction</h1>
          <Badge variant={isSuccess ? 'success' : 'destructive'}>
            {isSuccess ? (
              <><CheckCircle className="h-3 w-3 mr-1" /> Success</>
            ) : (
              <><XCircle className="h-3 w-3 mr-1" /> Failed</>
            )}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <p className="font-mono text-sm text-muted-foreground break-all">
            {transaction.id}
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => copyToClipboard(transaction.id)}
          >
            {copied ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>

        {transaction.ingest_error && (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Partial transaction data</p>
            <p className="mt-1">
              The indexer could not fetch full transaction details from the gRPC node.
              Reason: {transaction.ingest_error.reason || transaction.ingest_error.message}.
              Only the hash and error metadata are available.
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Transaction Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Block Height</label>
                  <p className="text-lg">
                    {transaction.height ? (
                      <Link
                        to={`/blocks/${transaction.height}`}
                        className="text-primary hover:text-primary/80"
                      >
                        #{formatNumber(transaction.height)}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground text-sm">Unavailable</span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Timestamp</label>
                  {transaction.timestamp ? (
                    <>
                      <p className="text-sm">{formatTimeAgo(transaction.timestamp)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.timestamp).toLocaleString()}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Unavailable</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fee</label>
                  <p className="text-sm">
                    {feeAmounts.length > 0
                      ? feeAmounts.map((fee: any, idx: number) => (
                          <span key={idx}>
                            {formatNumber(fee.amount)} {fee.denom}
                            {idx < feeAmounts.length - 1 && ', '}
                          </span>
                        ))
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Gas Limit</label>
                  <p className="text-sm">{transaction.fee?.gasLimit ? formatNumber(transaction.fee.gasLimit) : 'N/A'}</p>
                </div>
              </div>

              {transaction.memo && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-muted-foreground">Memo</label>
                  <p className="text-sm bg-muted p-3 rounded font-mono mt-1">
                    {transaction.memo}
                  </p>
                </div>
              )}

              {transaction.error && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-muted-foreground">Error</label>
                  <p className="text-sm bg-red-50 text-red-900 p-3 rounded mt-1">
                    {transaction.error}
                  </p>
                </div>
              )}

              {/* Dynamic Message-Specific Details */}
              {transaction.messages && transaction.messages.length > 0 && (
                <div className="mt-6 space-y-4">
                  <div className="border-t pt-4">
                    <label className="text-sm font-medium text-muted-foreground mb-3 block">Transaction Details</label>
                    {transaction.messages.map((message, msgIdx) => {
                      // Include events where msg_index matches OR is null (null means it applies to message 0)
                      const messageEvents = transaction.events?.filter(e =>
                        e.msg_index === msgIdx || (e.msg_index === null && msgIdx === 0)
                      ) || []
                      const groupedEvents = groupEvents(messageEvents)

                      return (
                        <div key={msgIdx} className="mb-4">
                          {msgIdx > 0 && <div className="border-t my-4" />}
                          <MessageDetails
                            type={message.type ?? 'Unknown'}
                            metadata={message.metadata}
                            events={groupedEvents}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Messages & Events - Enhanced Nested View */}
          <Card>
            <CardHeader>
              <CardTitle>Messages & Events ({transaction.messages?.length || 0} messages)</CardTitle>
            </CardHeader>
            <CardContent>
              {transaction.messages && transaction.messages.length > 0 ? (
                <div className="space-y-3">
                  {transaction.messages.map((message, msgIdx) => {
                    const messageColor = MESSAGE_COLORS[msgIdx % MESSAGE_COLORS.length]
                    // Include events where msg_index matches OR is null (null means it applies to message 0)
                    const messageEvents = transaction.events?.filter(e =>
                      e.msg_index === msgIdx || (e.msg_index === null && msgIdx === 0)
                    ) || []
                    const groupedEvents = groupEvents(messageEvents)
                    const isExpanded = expandedMessages[msgIdx]

                    return (
                      <Collapsible
                        key={msgIdx}
                        open={isExpanded}
                        onOpenChange={() => setExpandedMessages(prev => ({ ...prev, [msgIdx]: !prev[msgIdx] }))}
                      >
                        <div className="border rounded-lg overflow-hidden">
                          {/* Accent line */}
                          <div className={`h-0.5 ${messageColor} w-1/3`} />

                          <CollapsibleTrigger className="w-full p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className="text-sm font-medium">Message #{msgIdx}</span>
                                <Badge variant="outline" className="font-mono text-xs">
                                  {message.type || 'Unknown'}
                                </Badge>
                                {groupedEvents.length > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {groupedEvents.length} events
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <div className="px-4 pb-4 space-y-4">
                              {/* Message Details */}
                              {message.sender && (
                                <div className="bg-muted/30 rounded-lg p-3">
                                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sender</label>
                                  <div className="flex items-center gap-2 mt-1">
                                    <code className="text-sm font-mono">{message.sender}</code>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5"
                                      onClick={() => message.sender && copyToClipboard(message.sender)}
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {/* Events nested under message */}
                              {groupedEvents.length > 0 && (
                                <div className="space-y-2 pl-4 border-l-2 border-muted">
                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                                    Events
                                  </p>
                                  {groupedEvents.map((event, evtIdx) => {
                                    const eventKey = `${msgIdx}-${event.event_index}`
                                    const isEventExpanded = expandedEvents[eventKey]

                                    return (
                                      <Collapsible
                                        key={eventKey}
                                        open={isEventExpanded}
                                        onOpenChange={() => setExpandedEvents(prev => ({ ...prev, [eventKey]: !prev[eventKey] }))}
                                      >
                                        <div className="border rounded-lg overflow-hidden bg-card">
                                          <div className={`h-0.5 ${messageColor} opacity-60 w-1/4`} />

                                          <CollapsibleTrigger className="w-full p-3 hover:bg-muted/30 transition-colors">
                                            <div className="flex items-center justify-between text-left">
                                              <div className="flex items-center gap-2">
                                                {isEventExpanded ? (
                                                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                                ) : (
                                                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                                )}
                                                <Badge variant="outline" className="text-xs">
                                                  {event.event_type}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                  {event.attributes.length} attributes
                                                </span>
                                              </div>
                                            </div>
                                          </CollapsibleTrigger>

                                          <CollapsibleContent>
                                            <div className="px-3 pb-3 space-y-2">
                                              {event.attributes.map((attr, attrIdx) => {
                                                const isJson = isJsonString(attr.value)

                                                return (
                                                  <div key={attrIdx} className={isJson ? "bg-muted/20 rounded p-2" : "bg-muted/20 rounded p-2"}>
                                                    <div className="flex flex-col gap-2">
                                                      <span className="text-xs font-medium text-muted-foreground">
                                                        {attr.key}:
                                                      </span>
                                                      {isJson ? (
                                                        <JsonViewer data={attr.value} maxHeight={400} />
                                                      ) : (
                                                        <span className="text-xs font-mono break-all">
                                                          {attr.value}
                                                        </span>
                                                      )}
                                                    </div>
                                                  </div>
                                                )
                                              })}
                                            </div>
                                          </CollapsibleContent>
                                        </div>
                                      </Collapsible>
                                    )
                                  })}
                                </div>
                              )}

                              {/* Raw Data */}
                              <div className="pt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleRawData(msgIdx)}
                                  className="w-full"
                                >
                                  {showRawData[msgIdx] ? <Eye className="h-4 w-4 mr-2" /> : <Code className="h-4 w-4 mr-2" />}
                                  {showRawData[msgIdx] ? 'Hide' : 'Show'} Raw Data
                                </Button>
                                {showRawData[msgIdx] && message.data && (
                                  <div className="mt-2 text-xs bg-muted p-3 rounded overflow-auto max-h-48">
                                    <pre>{JSON.stringify(message.data, null, 2)}</pre>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {transaction.ingest_error
                    ? 'The indexer could not decode this transaction from the RPC source.'
                    : 'No messages found'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className={isSuccess ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                    {isSuccess ? 'Success' : 'Failed'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Messages</span>
                  <span className="font-medium">{transaction.messages?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Events</span>
                  <span className="font-medium">{transaction.events?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Block</span>
                  {transaction.height ? (
                    <Link
                      to={`/blocks/${transaction.height}`}
                      className="font-medium text-primary hover:text-primary/80"
                    >
                      #{formatNumber(transaction.height)}
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground">Unavailable</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* EVM Data if available */}
          {transaction.evm_data && (
            <Card>
              <CardHeader>
                <CardTitle>EVM Transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {transaction.evm_data.hash && (
                    <div>
                      <label className="text-muted-foreground">EVM Hash</label>
                      <p className="font-mono text-xs break-all">{transaction.evm_data.hash}</p>
                    </div>
                  )}
                  {transaction.evm_data.from_address && (
                    <div>
                      <label className="text-muted-foreground">From</label>
                      <p className="font-mono text-xs">{formatHash(transaction.evm_data.from_address, 8)}</p>
                    </div>
                  )}
                  {transaction.evm_data.to_address && (
                    <div>
                      <label className="text-muted-foreground">To</label>
                      <p className="font-mono text-xs">{formatHash(transaction.evm_data.to_address, 8)}</p>
                    </div>
                  )}
                  {transaction.evm_data.gas_used && (
                    <div>
                      <label className="text-muted-foreground">Gas Used</label>
                      <p className="font-mono text-xs">{formatNumber(transaction.evm_data.gas_used)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
