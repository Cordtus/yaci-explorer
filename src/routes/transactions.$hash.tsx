import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { ArrowLeft, Copy, CheckCircle, XCircle, Code, Eye, ChevronDown, ChevronRight, Filter, ToggleLeft, ToggleRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { formatNumber, formatTimeAgo, formatHash } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { MessageDetails } from '@/components/MessageDetails'
import { JsonViewer } from '@/components/JsonViewer'
import { AddressChip } from '@/components/AddressChip'
import { EVMTransactionCard } from '@/components/EVMTransactionCard'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'

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


// Group events by event_type for the UI
function groupEventsByType(events: any[]) {
  const grouped = new Map<string, any[]>()
  events.forEach(event => {
    const type = event.event_type
    if (!grouped.has(type)) {
      grouped.set(type, [])
    }
    grouped.get(type)!.push(event)
  })
  return Array.from(grouped.entries()).map(([type, evts]) => ({
    type,
    events: evts,
    count: evts.length
  }))
}

// Check if value looks like an address
function isAddress(value: string): boolean {
  return /^(manifest1|0x)[a-zA-Z0-9]{20,}$/.test(value)
}

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
  const [expandedEventTypes, setExpandedEventTypes] = useState<Record<string, boolean>>({})
  const [eventFilter, setEventFilter] = useState('')
  const [evmView, setEvmView] = useState(false)
  const params = useParams()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    setMounted(true)
    // Auto-enable EVM view if searched by EVM hash
    if (searchParams.get('evm') === 'true') {
      setEvmView(true)
    }
  }, [searchParams])

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

        {/* EVM View Toggle */}
        {transaction.evm_data && (
          <div className="mt-4 flex items-center gap-3">
            <Button
              variant={evmView ? "default" : "outline"}
              size="sm"
              onClick={() => setEvmView(!evmView)}
              className="gap-2"
            >
              {evmView ? (
                <><ToggleRight className="h-4 w-4" /> EVM View</>
              ) : (
                <><ToggleLeft className="h-4 w-4" /> Cosmos View</>
              )}
            </Button>
            <span className="text-xs text-muted-foreground">
              {evmView ? 'Showing EVM transaction details' : 'Showing Cosmos SDK transaction details'}
            </span>
          </div>
        )}

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
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* EVM View Mode - Show EVM card prominently */}
          {evmView && transaction.evm_data && (
            <EVMTransactionCard evmData={transaction.evm_data} />
          )}

          {/* Transaction Overview - Show in both modes */}
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

          {/* Messages & Events - Enhanced View */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Messages & Events ({transaction.messages?.length || 0} messages)</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {transaction.messages && transaction.messages.length > 0 ? (
                <div className="space-y-4">
                  {transaction.messages.map((message, msgIdx) => {
                    const messageEvents = transaction.events?.filter(e =>
                      e.msg_index === msgIdx || (e.msg_index === null && msgIdx === 0)
                    ) || []
                    const groupedEvents = groupEvents(messageEvents)
                    const eventsByType = groupEventsByType(groupedEvents)
                    const isExpanded = expandedMessages[msgIdx]

                    // Extract key info for summary
                    const msgType = message.type?.split('.').pop() || 'Unknown'
                    const sender = message.sender || message.data?.from_address

                    return (
                      <Collapsible
                        key={msgIdx}
                        open={isExpanded}
                        onOpenChange={() => setExpandedMessages(prev => ({ ...prev, [msgIdx]: !prev[msgIdx] }))}
                      >
                        <div className="border rounded-lg overflow-hidden">
                          <CollapsibleTrigger className="w-full p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                                <div className="text-left">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold">{msgType}</span>
                                    <Badge variant="outline" className="font-mono text-xs">
                                      #{msgIdx}
                                    </Badge>
                                  </div>
                                  {sender && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      From: {sender.slice(0, 12)}...{sender.slice(-6)}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {groupedEvents.length} events
                              </div>
                            </div>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <div className="px-4 pb-4 space-y-4 border-t">
                              {/* Sender with AddressChip */}
                              {sender && (
                                <div className="pt-4">
                                  <AddressChip address={sender} label="From" />
                                </div>
                              )}

                              {/* Events grouped by type */}
                              {eventsByType.length > 0 && (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                      Events ({groupedEvents.length})
                                    </p>
                                    {groupedEvents.length > 3 && (
                                      <div className="flex items-center gap-2">
                                        <Filter className="h-3 w-3 text-muted-foreground" />
                                        <Input
                                          placeholder="Filter events..."
                                          value={eventFilter}
                                          onChange={(e) => setEventFilter(e.target.value)}
                                          className="h-7 w-40 text-xs"
                                        />
                                      </div>
                                    )}
                                  </div>

                                  {eventsByType.map(({ type, events: typeEvents }) => {
                                    const typeKey = `${msgIdx}-${type}`
                                    const isTypeExpanded = expandedEventTypes[typeKey]
                                    const filteredEvents = eventFilter
                                      ? typeEvents.filter(e =>
                                          e.attributes.some((a: { key: string; value: string }) =>
                                            a.key.toLowerCase().includes(eventFilter.toLowerCase()) ||
                                            a.value.toLowerCase().includes(eventFilter.toLowerCase())
                                          )
                                        )
                                      : typeEvents

                                    if (filteredEvents.length === 0) return null

                                    return (
                                      <Collapsible
                                        key={typeKey}
                                        open={isTypeExpanded}
                                        onOpenChange={() => setExpandedEventTypes(prev => ({
                                          ...prev,
                                          [typeKey]: !prev[typeKey]
                                        }))}
                                      >
                                        <div className="border rounded-lg overflow-hidden">
                                          <CollapsibleTrigger className="w-full p-3 hover:bg-muted/30 transition-colors">
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-2">
                                                {isTypeExpanded ? (
                                                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                                ) : (
                                                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                                )}
                                                <span className="text-xs font-medium">
                                                  {type}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                  ({filteredEvents.length})
                                                </span>
                                              </div>
                                            </div>
                                          </CollapsibleTrigger>

                                          <CollapsibleContent>
                                            <div className="border-t">
                                              {filteredEvents.map((event, evtIdx) => (
                                                <div key={evtIdx} className="border-b last:border-b-0">
                                                  <Table>
                                                    <TableHeader>
                                                      <TableRow className="bg-muted/30">
                                                        <TableHead className="w-1/3 text-xs py-2">Key</TableHead>
                                                        <TableHead className="text-xs py-2">Value</TableHead>
                                                      </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                      {event.attributes.map((attr: { key: string; value: string }, attrIdx: number) => {
                                                        const isJson = isJsonString(attr.value)
                                                        const addrMatch = isAddress(attr.value)

                                                        return (
                                                          <TableRow key={attrIdx}>
                                                            <TableCell className="font-medium text-xs py-2 text-muted-foreground">
                                                              {attr.key}
                                                            </TableCell>
                                                            <TableCell className="text-xs py-2">
                                                              {isJson ? (
                                                                <JsonViewer data={attr.value} maxHeight={200} />
                                                              ) : addrMatch ? (
                                                                <AddressChip address={attr.value} truncate />
                                                              ) : (
                                                                <span className="font-mono break-all">{attr.value}</span>
                                                              )}
                                                            </TableCell>
                                                          </TableRow>
                                                        )
                                                      })}
                                                    </TableBody>
                                                  </Table>
                                                </div>
                                              ))}
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

          {/* EVM Data in sidebar when in Cosmos view */}
          {!evmView && transaction.evm_data && (
            <EVMTransactionCard evmData={transaction.evm_data} />
          )}
        </div>
      </div>
    </div>
  )
}
