import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { ArrowLeft, Copy, CheckCircle, XCircle, Code, Eye, ChevronDown, ChevronRight, Filter, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { getEnv } from '@/lib/env'
import { formatNumber, formatTimeAgo } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { MessageDetails } from '@/components/MessageDetails'
import { JsonViewer } from '@/components/JsonViewer'
import { AddressChip } from '@/components/AddressChip'
import { EVMTransactionCard } from '@/components/EVMTransactionCard'
import { EVMLogsCard } from '@/components/EVMLogsCard'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { css } from '@/styled-system/css'

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
    const eventGroup = grouped.get(event.event_index)
    if (eventGroup && event.attr_key && event.attr_value !== null) {
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
    grouped.get(type)?.push(event)
  })
  return Array.from(grouped.entries()).map(([type, evts]) => ({
    type,
    events: evts,
    count: evts.length
  }))
}

// Check if value looks like an address (bech32 or hex)
function isAddress(value: string): boolean {
  return /^[a-z]+1[a-z0-9]{38,}$/.test(value) || /^0x[a-fA-F0-9]{40}$/.test(value)
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
  const [isDecodingEVM, setIsDecodingEVM] = useState(false)
  const [decodeAttempted, setDecodeAttempted] = useState(false)
  const params = useParams()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    setMounted(true)
    // Auto-enable EVM view if searched by EVM hash
    if (searchParams.get('evm') === 'true') {
      setEvmView(true)
    }
  }, [searchParams])

  const { data: transaction, isLoading, error, refetch } = useQuery({
    queryKey: ['transaction', params.hash],
    queryFn: async () => {
      if (!params.hash) throw new Error('Transaction hash is required')
      const result = await api.getTransaction(params.hash)
      return result
    },
    enabled: mounted && !!params.hash,
    refetchInterval: isDecodingEVM ? 2000 : false,
  })

  useEffect(() => {
    if (!transaction || decodeAttempted) return

    const isEVMTransaction = transaction.messages?.some(
      (msg) => msg.type === '/ethermint.evm.v1.MsgEthereumTx'
    )

    if (isEVMTransaction && !transaction.evm_data) {
      setIsDecodingEVM(true)
      setDecodeAttempted(true)

      const apiURL = getEnv('VITE_POSTGREST_URL', '/api')!

      fetch(`${apiURL}/rpc/request_evm_decode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'params=single-object'
        },
        body: JSON.stringify({ _tx_id: transaction.id }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log('Priority EVM decode requested:', data.message)
          if (data.success && data.status !== 'not_found') {
            setTimeout(() => {
              refetch().then(() => {
                setIsDecodingEVM(false)
              })
            }, 2000)
          } else {
            setIsDecodingEVM(false)
          }
        })
        .catch((err) => {
          console.error('Failed to request priority decode:', err)
          setIsDecodingEVM(false)
        })
    }
  }, [transaction, decodeAttempted, refetch])

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
      <div className={css(styles.pageContainer)}>
        <Link to="/tx" className={css(styles.backLink)}>
          <ArrowLeft className={css(styles.backLinkIcon)} />
          Back to Transactions
        </Link>
        <Card>
          <CardContent className={css(styles.cardContentWithPadding)}>
            <div className={css(styles.errorContainer)}>
              <XCircle className={css(styles.errorIcon)} />
              <h2 className={css(styles.errorTitle)}>Transaction Not Found</h2>
              <p className={css(styles.errorDescription)}>
                The requested transaction could not be found.
              </p>
              <p className={css(styles.errorMessage)}>{String(error)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!mounted || isLoading) {
    return (
      <div className={css(styles.pageContainer)}>
        <Skeleton className={css(styles.skeletonHeader)} />
        <Skeleton className={css(styles.skeletonMedium)} />
        <Skeleton className={css(styles.skeletonLarge)} />
      </div>
    )
  }

  if (!transaction) {
    return null
  }

  const isSuccess = !transaction.error
  const feeAmounts = transaction.fee?.amount ?? []
  const groupedEvents = groupEvents(transaction.events || [])

  return (
    <div className={css(styles.pageContainerLarge)}>
      {/* Header */}
      <div>
        <Link to="/tx" className={css(styles.backLinkWithMargin)}>
          <ArrowLeft className={css(styles.backLinkIcon)} />
          Back to Transactions
        </Link>
        <div className={css(styles.headerTitleContainer)}>
          <h1 className={css(styles.headerTitle)}>Transaction</h1>
          <Badge variant={isSuccess ? 'success' : 'destructive'}>
            {isSuccess ? (
              <><CheckCircle className={css(styles.badgeIcon)} /> Success</>
            ) : (
              <><XCircle className={css(styles.badgeIcon)} /> Failed</>
            )}
          </Badge>
        </div>
        <div className={css(styles.hashContainer)}>
          <p className={css(styles.hashText)}>
            {transaction.id}
          </p>
          <Button
            variant="ghost"
            size="icon"
            className={css(styles.copyButton)}
            onClick={() => copyToClipboard(transaction.id)}
          >
            {copied ? <CheckCircle className={css(styles.copyIcon)} /> : <Copy className={css(styles.copyIcon)} />}
          </Button>
        </div>

        {/* EVM View Toggle */}
        {transaction.evm_data && (
          <div className={css(styles.evmToggleContainer)}>
            <Button
              variant={evmView ? "default" : "outline"}
              size="sm"
              onClick={() => setEvmView(!evmView)}
              className={css(styles.evmToggleButton)}
            >
              {evmView ? (
                <><ToggleRight className={css(styles.toggleIcon)} /> EVM View</>
              ) : (
                <><ToggleLeft className={css(styles.toggleIcon)} /> Cosmos View</>
              )}
            </Button>
          </div>
        )}

        {/* EVM Decoding Status */}
        {isDecodingEVM && (
          <div className={css(styles.decodingStatus)}>
            <Loader2 className={css(styles.decodingIcon)} />
            <span>Decoding EVM transaction data...</span>
          </div>
        )}

        {transaction.ingest_error && (
          <div className={css(styles.ingestErrorBox)}>
            <p className={css(styles.ingestErrorTitle)}>Partial transaction data</p>
            <p className={css(styles.ingestErrorMessage)}>
              The indexer could not fetch full transaction details from the gRPC node.
              Reason: {transaction.ingest_error.reason || transaction.ingest_error.message}.
              Only the hash and error metadata are available.
            </p>
          </div>
        )}
      </div>

      <div className={css(styles.mainGrid)}>
        {/* Main Content Area */}
        <div className={css(styles.mainContent)}>
          {/* EVM View Mode - Show EVM card prominently */}
          {evmView && transaction.evm_data && (
            <>
              <EVMTransactionCard evmData={transaction.evm_data} />
              {transaction.evm_logs && transaction.evm_logs.length > 0 && (
                <EVMLogsCard logs={transaction.evm_logs} />
              )}
            </>
          )}

          {/* Transaction Overview - Show in both modes */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={css(styles.overviewGrid)}>
                <div>
                  <label className={css(styles.fieldLabel)}>Block Height</label>
                  <p className={css(styles.fieldValueLarge)}>
                    {transaction.height ? (
                      <Link
                        to={`/blocks/${transaction.height}`}
                        className={css(styles.primaryLink)}
                      >
                        #{formatNumber(transaction.height)}
                      </Link>
                    ) : (
                      <span className={css(styles.unavailableText)}>Unavailable</span>
                    )}
                  </p>
                </div>
                <div>
                  <label className={css(styles.fieldLabel)}>Timestamp</label>
                  {transaction.timestamp ? (
                    <>
                      <p className={css(styles.fieldValueSmall)}>{formatTimeAgo(transaction.timestamp)}</p>
                      <p className={css(styles.timestampSecondary)}>
                        {new Date(transaction.timestamp).toLocaleString()}
                      </p>
                    </>
                  ) : (
                    <p className={css(styles.unavailableTextSmall)}>Unavailable</p>
                  )}
                </div>
                <div>
                  <label className={css(styles.fieldLabel)}>Fee</label>
                  <p className={css(styles.fieldValueSmall)}>
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
                  <label className={css(styles.fieldLabel)}>Gas Limit</label>
                  <p className={css(styles.fieldValueSmall)}>{transaction.fee?.gasLimit ? formatNumber(transaction.fee.gasLimit) : 'N/A'}</p>
                </div>
              </div>

              {transaction.memo && (
                <div className={css(styles.memoContainer)}>
                  <label className={css(styles.fieldLabel)}>Memo</label>
                  <p className={css(styles.memoText)}>
                    {transaction.memo}
                  </p>
                </div>
              )}

              {transaction.error && (
                <div className={css(styles.errorFieldContainer)}>
                  <label className={css(styles.fieldLabel)}>Error</label>
                  <p className={css(styles.errorFieldText)}>
                    {transaction.error}
                  </p>
                </div>
              )}

              {/* Dynamic Message-Specific Details */}
              {transaction.messages && transaction.messages.length > 0 && (
                <div className={css(styles.messageDetailsContainer)}>
                  <div className={css(styles.messageDetailsBorder)}>
                    <label className={css(styles.messageDetailsLabel)}>Transaction Details</label>
                    {transaction.messages.map((message, msgIdx) => {
                      // Include events where msg_index matches OR is null (null means it applies to message 0)
                      const messageEvents = transaction.events?.filter(e =>
                        e.msg_index === msgIdx || (e.msg_index === null && msgIdx === 0)
                      ) || []
                      const groupedEvents = groupEvents(messageEvents)

                      return (
                        <div key={msgIdx} className={css(styles.messageDetailItem)}>
                          {msgIdx > 0 && <div className={css(styles.messageDetailDivider)} />}
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
              <div className={css(styles.messagesHeaderContainer)}>
                <CardTitle>Messages & Events ({transaction.messages?.length || 0} messages)</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {transaction.messages && transaction.messages.length > 0 ? (
                <div className={css(styles.messagesContainer)}>
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
                        <div className={css(styles.collapsibleBorder)}>
                          <CollapsibleTrigger className={css(styles.collapsibleTrigger)}>
                            <div className={css(styles.collapsibleTriggerContent)}>
                              <div className={css(styles.collapsibleTriggerLeft)}>
                                {isExpanded ? (
                                  <ChevronDown className={css(styles.chevronIcon)} />
                                ) : (
                                  <ChevronRight className={css(styles.chevronIcon)} />
                                )}
                                <div className={css(styles.messageTypeContainer)}>
                                  <div className={css(styles.messageTypeHeader)}>
                                    <span className={css(styles.messageTypeName)}>{msgType}</span>
                                    <Badge variant="outline" className={css(styles.messageIndexBadge)}>
                                      #{msgIdx}
                                    </Badge>
                                  </div>
                                  {sender && (
                                    <div className={css(styles.messageSender)}>
                                      From: {sender.slice(0, 12)}...{sender.slice(-6)}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className={css(styles.eventCount)}>
                                {groupedEvents.length} events
                              </div>
                            </div>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <div className={css(styles.collapsibleContentInner)}>
                              {/* Sender with AddressChip */}
                              {sender && (
                                <div className={css(styles.senderChipContainer)}>
                                  <AddressChip address={sender} label="From" />
                                </div>
                              )}

                              {/* Events grouped by type */}
                              {eventsByType.length > 0 && (
                                <div className={css(styles.eventsGroupContainer)}>
                                  <div className={css(styles.eventsHeader)}>
                                    <p className={css(styles.eventsHeaderLabel)}>
                                      Events ({groupedEvents.length})
                                    </p>
                                    {groupedEvents.length > 3 && (
                                      <div className={css(styles.filterContainer)}>
                                        <Filter className={css(styles.filterIcon)} />
                                        <Input
                                          placeholder="Filter events..."
                                          value={eventFilter}
                                          onChange={(e) => setEventFilter(e.target.value)}
                                          className={css(styles.filterInput)}
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
                                        <div className={css(styles.eventTypeBorder)}>
                                          <CollapsibleTrigger className={css(styles.eventTypeTrigger)}>
                                            <div className={css(styles.eventTypeTriggerContent)}>
                                              <div className={css(styles.eventTypeLeft)}>
                                                {isTypeExpanded ? (
                                                  <ChevronDown className={css(styles.chevronSmallIcon)} />
                                                ) : (
                                                  <ChevronRight className={css(styles.chevronSmallIcon)} />
                                                )}
                                                <span className={css(styles.eventTypeName)}>
                                                  {type}
                                                </span>
                                                <span className={css(styles.eventTypeCount)}>
                                                  ({filteredEvents.length})
                                                </span>
                                              </div>
                                            </div>
                                          </CollapsibleTrigger>

                                          <CollapsibleContent>
                                            <div className={css(styles.eventTypeContentBorder)}>
                                              {filteredEvents.map((event, evtIdx) => (
                                                <div key={evtIdx} className={css(styles.eventItemBorder)}>
                                                  <Table>
                                                    <TableHeader>
                                                      <TableRow className={css(styles.tableHeaderRow)}>
                                                        <TableHead className={css(styles.tableHeaderKey)}>Key</TableHead>
                                                        <TableHead className={css(styles.tableHeaderValue)}>Value</TableHead>
                                                      </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                      {event.attributes.map((attr: { key: string; value: string }, attrIdx: number) => {
                                                        const isJson = isJsonString(attr.value)
                                                        const addrMatch = isAddress(attr.value)

                                                        return (
                                                          <TableRow key={attrIdx}>
                                                            <TableCell className={css(styles.tableKeyCell)}>
                                                              {attr.key}
                                                            </TableCell>
                                                            <TableCell className={css(styles.tableValueCell)}>
                                                              {isJson ? (
                                                                <JsonViewer data={attr.value} maxHeight={200} />
                                                              ) : addrMatch ? (
                                                                <AddressChip address={attr.value} truncate />
                                                              ) : (
                                                                <span className={css(styles.monoText)}>{attr.value}</span>
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
                              <div className={css(styles.rawDataContainer)}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleRawData(msgIdx)}
                                  className={css(styles.rawDataButton)}
                                >
                                  {showRawData[msgIdx] ? <Eye className={css(styles.rawDataIcon)} /> : <Code className={css(styles.rawDataIcon)} />}
                                  {showRawData[msgIdx] ? 'Hide' : 'Show'} Raw Data
                                </Button>
                                {showRawData[msgIdx] && message.data && (
                                  <div className={css(styles.rawDataContent)}>
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
                <p className={css(styles.noMessagesText)}>
                  {transaction.ingest_error
                    ? 'The indexer could not decode this transaction from the RPC source.'
                    : 'No messages found'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className={css(styles.sidebar)}>
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={css(styles.summaryContainer)}>
                <div className={css(styles.summaryRow)}>
                  <span className={css(styles.summaryLabel)}>Status</span>
                  <span className={css(isSuccess ? styles.summaryValueSuccess : styles.summaryValueError)}>
                    {isSuccess ? 'Success' : 'Failed'}
                  </span>
                </div>
                <div className={css(styles.summaryRow)}>
                  <span className={css(styles.summaryLabel)}>Messages</span>
                  <span className={css(styles.summaryValue)}>{transaction.messages?.length || 0}</span>
                </div>
                <div className={css(styles.summaryRow)}>
                  <span className={css(styles.summaryLabel)}>Events</span>
                  <span className={css(styles.summaryValue)}>{groupedEvents.length}</span>
                </div>
                <div className={css(styles.summaryRow)}>
                  <span className={css(styles.summaryLabel)}>Block</span>
                  {transaction.height ? (
                    <Link
                      to={`/blocks/${transaction.height}`}
                      className={css(styles.summaryLinkValue)}
                    >
                      #{formatNumber(transaction.height)}
                    </Link>
                  ) : (
                    <span className={css(styles.unavailableTextSmall)}>Unavailable</span>
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

const styles = {
  pageContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  pageContainerLarge: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  backLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'fg.muted',
    _hover: {
      color: 'fg.default'
    }
  },
  backLinkWithMargin: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'fg.muted',
    marginBottom: '1rem',
    _hover: {
      color: 'fg.default'
    }
  },
  backLinkIcon: {
    height: '1rem',
    width: '1rem'
  },
  cardContentWithPadding: {
    paddingTop: '1.5rem'
  },
  errorContainer: {
    textAlign: 'center',
    paddingY: '3rem'
  },
  errorIcon: {
    height: '3rem',
    width: '3rem',
    color: 'red.500',
    marginX: 'auto',
    marginBottom: '1rem'
  },
  errorTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: 'red.600',
    marginBottom: '0.5rem'
  },
  errorDescription: {
    color: 'fg.muted',
    marginBottom: '1rem'
  },
  errorMessage: {
    fontSize: 'sm',
    color: 'red.500'
  },
  skeletonHeader: {
    height: '2rem',
    width: '12rem'
  },
  skeletonMedium: {
    height: '16rem',
    width: '100%'
  },
  skeletonLarge: {
    height: '24rem',
    width: '100%'
  },
  headerTitleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.5rem'
  },
  headerTitle: {
    fontSize: '1.875rem',
    fontWeight: 'bold'
  },
  badgeIcon: {
    height: '0.75rem',
    width: '0.75rem',
    marginRight: '0.25rem'
  },
  hashContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  hashText: {
    fontFamily: 'mono',
    fontSize: 'sm',
    color: 'fg.muted',
    wordBreak: 'break-all'
  },
  copyButton: {
    height: '1.5rem',
    width: '1.5rem'
  },
  copyIcon: {
    height: '0.75rem',
    width: '0.75rem'
  },
  evmToggleContainer: {
    marginTop: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  evmToggleButton: {
    gap: '0.5rem'
  },
  toggleIcon: {
    height: '1rem',
    width: '1rem'
  },
  evmToggleLabel: {
    fontSize: 'xs',
    color: 'fg.muted'
  },
  decodingStatus: {
    marginTop: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: 'sm',
    color: 'fg.muted'
  },
  decodingIcon: {
    height: '1rem',
    width: '1rem',
    animation: 'spin'
  },
  ingestErrorBox: {
    marginTop: '1rem',
    borderRadius: 'md',
    border: '1px solid',
    borderColor: 'amber.200',
    backgroundColor: 'amber.50',
    padding: '1rem',
    fontSize: 'sm',
    color: 'amber.900'
  },
  ingestErrorTitle: {
    fontWeight: 'semibold'
  },
  ingestErrorMessage: {
    marginTop: '0.25rem'
  },
  mainGrid: {
    display: 'grid',
    gap: '1.5rem',
    gridTemplateColumns: { base: '1fr', lg: 'repeat(3, 1fr)' }
  },
  mainContent: {
    gridColumn: { base: 'auto', lg: 'span 2' },
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  overviewGrid: {
    display: 'grid',
    gridTemplateColumns: { base: '1fr', md: 'repeat(2, 1fr)' },
    gap: '1rem'
  },
  fieldLabel: {
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'fg.muted'
  },
  fieldValueLarge: {
    fontSize: 'lg'
  },
  fieldValueSmall: {
    fontSize: 'sm'
  },
  primaryLink: {
    color: 'colorPalette.fg',
    _hover: {
      color: 'colorPalette.emphasized'
    }
  },
  unavailableText: {
    color: 'fg.muted',
    fontSize: 'sm'
  },
  unavailableTextSmall: {
    fontSize: 'sm',
    color: 'fg.muted'
  },
  timestampSecondary: {
    fontSize: 'xs',
    color: 'fg.muted'
  },
  memoContainer: {
    marginTop: '1rem'
  },
  memoText: {
    fontSize: 'sm',
    backgroundColor: 'bg.muted',
    padding: '0.75rem',
    borderRadius: 'md',
    fontFamily: 'mono',
    marginTop: '0.25rem'
  },
  errorFieldContainer: {
    marginTop: '1rem'
  },
  errorFieldText: {
    fontSize: 'sm',
    backgroundColor: 'red.50',
    color: 'red.900',
    padding: '0.75rem',
    borderRadius: 'md',
    marginTop: '0.25rem'
  },
  messageDetailsContainer: {
    marginTop: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  messageDetailsBorder: {
    borderTop: '1px solid',
    borderColor: 'border.default',
    paddingTop: '1rem'
  },
  messageDetailsLabel: {
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'fg.muted',
    marginBottom: '0.75rem',
    display: 'block'
  },
  messageDetailItem: {
    marginBottom: '1rem'
  },
  messageDetailDivider: {
    borderTop: '1px solid',
    borderColor: 'border.default',
    marginY: '1rem'
  },
  messagesHeaderContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  messagesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  collapsibleBorder: {
    border: '1px solid',
    borderColor: 'border.default',
    borderRadius: 'lg',
    overflow: 'hidden'
  },
  collapsibleTrigger: {
    width: '100%',
    padding: '1rem',
    transition: 'colors',
    _hover: {
      backgroundColor: 'bg.muted/50'
    }
  },
  collapsibleTriggerContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  collapsibleTriggerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  chevronIcon: {
    height: '1rem',
    width: '1rem',
    color: 'fg.muted'
  },
  messageTypeContainer: {
    textAlign: 'left'
  },
  messageTypeHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  messageTypeName: {
    fontSize: 'sm',
    fontWeight: 'semibold'
  },
  messageIndexBadge: {
    fontFamily: 'mono',
    fontSize: 'xs'
  },
  messageSender: {
    fontSize: 'xs',
    color: 'fg.muted',
    marginTop: '0.25rem'
  },
  eventCount: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: 'xs',
    color: 'fg.muted'
  },
  collapsibleContentInner: {
    paddingX: '1rem',
    paddingBottom: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    borderTop: '1px solid',
    borderColor: 'border.default'
  },
  senderChipContainer: {
    paddingTop: '1rem'
  },
  eventsGroupContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  eventsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  eventsHeaderLabel: {
    fontSize: 'xs',
    fontWeight: 'medium',
    color: 'fg.muted',
    textTransform: 'uppercase',
    letterSpacing: 'wider'
  },
  filterContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  filterIcon: {
    height: '0.75rem',
    width: '0.75rem',
    color: 'fg.muted'
  },
  filterInput: {
    height: '1.75rem',
    width: '10rem',
    fontSize: 'xs'
  },
  eventTypeBorder: {
    border: '1px solid',
    borderColor: 'border.default',
    borderRadius: 'lg',
    overflow: 'hidden'
  },
  eventTypeTrigger: {
    width: '100%',
    padding: '0.75rem',
    transition: 'colors',
    _hover: {
      backgroundColor: 'bg.muted/30'
    }
  },
  eventTypeTriggerContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  eventTypeLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  chevronSmallIcon: {
    height: '0.75rem',
    width: '0.75rem',
    color: 'fg.muted'
  },
  eventTypeName: {
    fontSize: 'xs',
    fontWeight: 'medium'
  },
  eventTypeCount: {
    fontSize: 'xs',
    color: 'fg.muted'
  },
  eventTypeContentBorder: {
    borderTop: '1px solid',
    borderColor: 'border.default'
  },
  eventItemBorder: {
    borderBottom: '1px solid',
    borderColor: 'border.default',
    _last: {
      borderBottom: 'none'
    }
  },
  tableHeaderRow: {
    backgroundColor: 'bg.muted/30'
  },
  tableHeaderKey: {
    width: '33.333333%',
    fontSize: 'xs',
    paddingY: '0.5rem'
  },
  tableHeaderValue: {
    fontSize: 'xs',
    paddingY: '0.5rem'
  },
  tableKeyCell: {
    fontWeight: 'medium',
    fontSize: 'xs',
    paddingY: '0.5rem',
    color: 'fg.muted'
  },
  tableValueCell: {
    fontSize: 'xs',
    paddingY: '0.5rem'
  },
  monoText: {
    fontFamily: 'mono',
    wordBreak: 'break-all'
  },
  rawDataContainer: {
    paddingTop: '0.5rem'
  },
  rawDataButton: {
    width: '100%'
  },
  rawDataIcon: {
    height: '1rem',
    width: '1rem',
    marginRight: '0.5rem'
  },
  rawDataContent: {
    marginTop: '0.5rem',
    fontSize: 'xs',
    backgroundColor: 'bg.muted',
    padding: '0.75rem',
    borderRadius: 'md',
    overflowX: 'auto',
    maxHeight: '12rem'
  },
  noMessagesText: {
    fontSize: 'sm',
    color: 'fg.muted'
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  summaryContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between'
  },
  summaryLabel: {
    color: 'fg.muted'
  },
  summaryValue: {
    fontWeight: 'medium'
  },
  summaryValueSuccess: {
    color: 'green.600',
    fontWeight: 'medium'
  },
  summaryValueError: {
    color: 'red.600',
    fontWeight: 'medium'
  },
  summaryLinkValue: {
    fontWeight: 'medium',
    color: 'colorPalette.fg',
    _hover: {
      color: 'colorPalette.emphasized'
    }
  }
}
