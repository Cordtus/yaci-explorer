import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import {
  ArrowLeft,
  Copy,
  CheckCircle,
  XCircle,
  Code,
  Eye,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { YaciAPIClient } from '@/lib/api/client'
import { formatNumber, formatTimeAgo, formatHash } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { MessageDetails } from '@/components/MessageDetails'
import { JsonViewer } from '@/components/JsonViewer'
import { css } from '../../styled-system/css'

const api = new YaciAPIClient()

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

// Accent colors for different message types (Panda tokens)
const MESSAGE_COLORS = ['blue.8', 'violet.8', 'green.8', 'orange.8', 'pink.8', 'cyan.8', 'indigo.8', 'teal.8']

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
      <div className={styles.stack4}>
        <Link to="/transactions" className={styles.backLink}>
          <ArrowLeft className={styles.iconSm} />
          Back to Transactions
        </Link>
        <Card>
          <CardContent className={styles.cardPadTop}>
            <div className={styles.centeredEmpty}>
              <XCircle className={css({ h: '12', w: '12', color: 'red.8' })} />
              <h2 className={styles.errorTitle}>Transaction Not Found</h2>
              <p className={styles.mutedText}>
                The requested transaction could not be found.
              </p>
              <p className={styles.errorText}>{String(error)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!mounted || isLoading) {
    return (
      <div className={styles.stack4}>
        <Skeleton className={css({ h: '8', w: '48' })} />
        <Skeleton className={css({ h: '64', w: 'full' })} />
        <Skeleton className={css({ h: '96', w: 'full' })} />
      </div>
    )
  }

  if (!transaction) {
    return null
  }

  const isSuccess = !transaction.error

  return (
    <div className={styles.page}>
      {/* Header */}
      <div>
        <Link to="/transactions" className={styles.backLink}>
          <ArrowLeft className={styles.iconSm} />
          Back to Transactions
        </Link>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>Transaction</h1>
          <Badge variant={isSuccess ? 'success' : 'destructive'}>
            {isSuccess ? (
              <><CheckCircle className={styles.iconXs} /> Success</>
            ) : (
              <><XCircle className={styles.iconXs} /> Failed</>
            )}
          </Badge>
        </div>
        <div className={styles.txIdRow}>
          <p className={styles.codeSmMuted}>
            {transaction.id}
          </p>
          <Button
            variant="ghost"
            size="icon"
            className={styles.copyButton}
            onClick={() => copyToClipboard(transaction.id)}
          >
            {copied ? <CheckCircle className={styles.iconXs} /> : <Copy className={styles.iconXs} />}
          </Button>
        </div>
      </div>

      <div className={styles.layoutGrid}>
        <div className={styles.mainCol}>
          {/* Transaction Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={styles.infoGrid}>
                <div>
                  <label className={styles.label}>Block Height</label>
                  <p className={styles.valueLg}>
                    <Link
                      to={`/blocks/${transaction.height}`}
                      className={styles.link}
                    >
                      #{formatNumber(transaction.height)}
                    </Link>
                  </p>
                </div>
                <div>
                  <label className={styles.label}>Timestamp</label>
                  <p className={styles.textSm}>{formatTimeAgo(transaction.timestamp)}</p>
                  <p className={styles.metaText}>{new Date(transaction.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <label className={styles.label}>Fee</label>
                  <p className={styles.textSm}>
                    {transaction.fee?.amount?.map((fee: any, idx: number) => (
                      <span key={idx}>
                        {formatNumber(fee.amount)} {fee.denom}
                        {idx < transaction.fee.amount.length - 1 && ', '}
                      </span>
                    )) || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className={styles.label}>Gas Limit</label>
                  <p className={styles.textSm}>{transaction.fee?.gasLimit ? formatNumber(transaction.fee.gasLimit) : 'N/A'}</p>
                </div>
              </div>

              {transaction.memo && (
                <div className={styles.memo}>
                  <label className={styles.label}>Memo</label>
                  <p className={styles.memoText}>
                    {transaction.memo}
                  </p>
                </div>
              )}

              {transaction.error && (
                <div className={styles.errorBox}>
                  <label className={styles.label}>Error</label>
                  <p className={styles.errorPill}>
                    {transaction.error}
                  </p>
                </div>
              )}

              {/* Dynamic Message-Specific Details */}
              {transaction.messages && transaction.messages.length > 0 && (
                <div className={styles.stack4}>
                  <div className={styles.topDivider}>
                    <label className={styles.label}>
                      Transaction Details
                    </label>
                    {transaction.messages.map((message, msgIdx) => {
                      const messageEvents = transaction.events?.filter(e =>
                        e.msg_index === msgIdx || (e.msg_index === null && msgIdx === 0)
                      ) || []
                      const groupedEvents = groupEvents(messageEvents)

                      return (
                        <div key={msgIdx} className={styles.messageBlock}>
                          {msgIdx > 0 && <div className={styles.divider} />}
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
                <div className={styles.stack3}>
                  {transaction.messages.map((message, msgIdx) => {
                    const messageColor = MESSAGE_COLORS[msgIdx % MESSAGE_COLORS.length]
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
                        <div className={styles.panel}>
                          <div className={css({ h: '0.5', w: '33%', bg: messageColor })} />

                          <CollapsibleTrigger className={styles.trigger}>
                            <div className={styles.triggerInner}>
                              {isExpanded ? (
                                <ChevronDown className={styles.iconSm} />
                              ) : (
                                <ChevronRight className={styles.iconSm} />
                              )}
                              <span className={styles.textSmBold}>Message #{msgIdx}</span>
                              <Badge variant="outline" className={styles.badgeXs}>
                                {message.type || 'Unknown'}
                              </Badge>
                              {groupedEvents.length > 0 && (
                                <Badge variant="secondary" className={styles.badgeXs}>
                                  {groupedEvents.length} events
                                </Badge>
                              )}
                            </div>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <div className={styles.panelBody}>
                              {message.sender && (
                                <div className={styles.cardMuted}>
                                  <label className={styles.labelUpper}>Sender</label>
                                  <div className={styles.rowGap2}>
                                    <code className={styles.codeSm}>{message.sender}</code>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className={styles.iconButton}
                                      onClick={() => message.sender && copyToClipboard(message.sender)}
                                    >
                                      <Copy className={styles.iconXs} />
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {groupedEvents.length > 0 && (
                                <div className={styles.eventList}>
                                  <p className={styles.labelUpper}>Events</p>
                                  {groupedEvents.map((event, evtIdx) => {
                                    const eventKey = `${msgIdx}-${event.event_index}`
                                    const isEventExpanded = expandedEvents[eventKey]
                                    return (
                                      <Collapsible
                                        key={eventKey}
                                        open={isEventExpanded}
                                        onOpenChange={() => setExpandedEvents(prev => ({ ...prev, [eventKey]: !prev[eventKey] }))}
                                      >
                                        <div className={styles.eventPanel}>
                                          <div className={css({ h: '0.5', w: '25%', bg: messageColor, opacity: 0.6 })} />

                                          <CollapsibleTrigger className={styles.eventTrigger}>
                                            <div className={styles.eventTriggerInner}>
                                              {isEventExpanded ? (
                                                <ChevronDown className={styles.iconXs} />
                                              ) : (
                                                <ChevronRight className={styles.iconXs} />
                                              )}
                                              <Badge variant="outline" className={styles.badgeXs}>
                                                {event.event_type}
                                              </Badge>
                                              <span className={styles.metaText}>
                                                {event.attributes.length} attributes
                                              </span>
                                            </div>
                                          </CollapsibleTrigger>

                                          <CollapsibleContent>
                                            <div className={styles.eventBody}>
                                              {event.attributes.map((attr, attrIdx) => {
                                                const isJson = isJsonString(attr.value)
                                                return (
                                                  <div key={attrIdx} className={styles.attrBox}>
                                                    <div className={styles.attrContent}>
                                                      <span className={styles.attrLabel}>
                                                        {attr.key}:
                                                      </span>
                                                      {isJson ? (
                                                        <JsonViewer data={attr.value} maxHeight={400} />
                                                      ) : (
                                                        <span className={styles.attrValue}>
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

                              <div className={css({ pt: '2' })}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleRawData(msgIdx)}
                                  className={styles.fullWidth}
                                >
                                  {showRawData[msgIdx] ? <Eye className={styles.iconSm} /> : <Code className={styles.iconSm} />}
                                  {showRawData[msgIdx] ? 'Hide' : 'Show'} Raw Data
                                </Button>
                                {showRawData[msgIdx] && message.data && (
                                  <div className={styles.rawBox}>
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
                <p className={styles.metaText}>No messages found</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className={styles.sidebar}>
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={styles.stack3}>
                <div className={styles.summaryRow}>
                  <span className={styles.mutedText}>Status</span>
                  <span className={isSuccess ? styles.successText : styles.errorText}>
                    {isSuccess ? 'Success' : 'Failed'}
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.mutedText}>Messages</span>
                  <span className={styles.summaryValue}>{transaction.messages?.length || 0}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.mutedText}>Events</span>
                  <span className={styles.summaryValue}>{transaction.events?.length || 0}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.mutedText}>Block</span>
                  <Link
                    to={`/blocks/${transaction.height}`}
                    className={styles.link}
                  >
                    #{formatNumber(transaction.height)}
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {transaction.evm_data && (
            <Card>
              <CardHeader>
                <CardTitle>EVM Transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={styles.stack3}>
                  {transaction.evm_data.hash && (
                    <div>
                      <label className={styles.mutedText}>EVM Hash</label>
                      <p className={styles.codeXs}>{transaction.evm_data.hash}</p>
                    </div>
                  )}
                  {transaction.evm_data.from_address && (
                    <div>
                      <label className={styles.mutedText}>From</label>
                      <p className={styles.codeXs}>{formatHash(transaction.evm_data.from_address, 8)}</p>
                    </div>
                  )}
                  {transaction.evm_data.to_address && (
                    <div>
                      <label className={styles.mutedText}>To</label>
                      <p className={styles.codeXs}>{formatHash(transaction.evm_data.to_address, 8)}</p>
                    </div>
                  )}
                  {transaction.evm_data.gas_used && (
                    <div>
                      <label className={styles.mutedText}>Gas Used</label>
                      <p className={styles.codeXs}>{formatNumber(transaction.evm_data.gas_used)}</p>
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

const styles = {
  page: css({ display: 'flex', flexDirection: 'column', gap: '6' }),
  stack4: css({ display: 'flex', flexDirection: 'column', gap: '4' }),
  stack3: css({ display: 'flex', flexDirection: 'column', gap: '3' }),
  backLink: css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2',
    color: 'fg.muted',
    _hover: { color: 'fg.default' },
    mb: '4',
  }),
  cardPadTop: css({ pt: '6' }),
  centeredEmpty: css({
    textAlign: 'center',
    py: '12',
    display: 'flex',
    flexDirection: 'column',
    gap: '3',
    alignItems: 'center',
  }),
  errorTitle: css({ fontSize: '2xl', fontWeight: 'bold', color: 'red.8' }),
  mutedText: css({ color: 'fg.muted' }),
  errorText: css({ color: 'red.8', fontSize: 'sm' }),
  iconSm: css({ h: '4', w: '4' }),
  iconXs: css({ h: '3', w: '3', mr: '1' }),
  headerRow: css({ display: 'flex', alignItems: 'center', gap: '3', mb: '2' }),
  title: css({ fontSize: '3xl', fontWeight: 'bold' }),
  txIdRow: css({ display: 'flex', alignItems: 'center', gap: '2' }),
  copyButton: css({ h: '6', w: '6' }),
  codeSmMuted: css({ fontFamily: 'mono', fontSize: 'sm', color: 'fg.muted', wordBreak: 'break-all' }),
  layoutGrid: css({
    display: 'grid',
    gap: '6',
    gridTemplateColumns: { base: '1fr', lg: '2fr 1fr' },
  }),
  mainCol: css({ display: 'flex', flexDirection: 'column', gap: '6' }),
  link: css({ color: 'colorPalette.default', _hover: { color: 'colorPalette.emphasized' } }),
  infoGrid: css({
    display: 'grid',
    gap: '4',
    gridTemplateColumns: { base: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
  }),
  label: css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.muted' }),
  valueLg: css({ fontSize: 'lg', fontWeight: 'bold' }),
  textSm: css({ fontSize: 'sm' }),
  metaText: css({ fontSize: 'xs', color: 'fg.muted' }),
  memo: css({ mt: '4' }),
  memoText: css({ fontSize: 'sm', bg: 'bg.muted', p: '3', rounded: 'md', fontFamily: 'mono', mt: '1' }),
  errorBox: css({ mt: '4' }),
  errorPill: css({ fontSize: 'sm', bg: 'red.1', color: 'red.11', p: '3', rounded: 'md', mt: '1' }),
  topDivider: css({ borderTopWidth: '1px', pt: '4' }),
  messageBlock: css({ mb: '4' }),
  divider: css({ borderTopWidth: '1px', my: '4' }),
  panel: css({
    borderWidth: '1px',
    rounded: 'lg',
    overflow: 'hidden',
    bg: 'bg.default',
  }),
  trigger: css({
    width: '100%',
    px: '4',
    py: '3.5',
    textAlign: 'left',
    transition: 'all 0.2s ease',
    _hover: { bg: 'bg.muted' },
  }),
  triggerInner: css({ display: 'flex', alignItems: 'center', gap: '3' }),
  textSmBold: css({ fontSize: 'sm', fontWeight: 'medium' }),
  badgeXs: css({ fontSize: 'xs' }),
  panelBody: css({ px: '4', pb: '4', display: 'flex', flexDirection: 'column', gap: '4' }),
  cardMuted: css({ bg: 'bg.muted', rounded: 'lg', p: '3', display: 'flex', flexDirection: 'column', gap: '1' }),
  labelUpper: css({ fontSize: 'xs', fontWeight: 'medium', color: 'fg.muted', textTransform: 'uppercase', letterSpacing: 'widest' }),
  codeSm: css({ fontFamily: 'mono', fontSize: 'sm' }),
  iconButton: css({ h: '5', w: '5', p: '0' }),
  eventList: css({ display: 'flex', flexDirection: 'column', gap: '2', pl: '4', borderLeftWidth: '2px', borderColor: 'border.subtle' }),
  eventPanel: css({ borderWidth: '1px', rounded: 'lg', overflow: 'hidden', bg: 'bg.card' }),
  eventTrigger: css({ width: '100%', px: '3', py: '3', textAlign: 'left', _hover: { bg: 'bg.muted' } }),
  eventTriggerInner: css({ display: 'flex', alignItems: 'center', gap: '2' }),
  eventBody: css({ px: '3', pb: '3', display: 'flex', flexDirection: 'column', gap: '2' }),
  attrBox: css({ bg: 'bg.muted', rounded: 'md', p: '2' }),
  attrContent: css({ display: 'flex', flexDirection: 'column', gap: '2' }),
  attrLabel: css({ fontSize: 'xs', fontWeight: 'medium', color: 'fg.muted' }),
  attrValue: css({ fontSize: 'xs', fontFamily: 'mono', wordBreak: 'break-all' }),
  fullWidth: css({ width: '100%', justifyContent: 'center', gap: '2' }),
  rawBox: css({ mt: '2', fontSize: 'xs', bg: 'bg.muted', p: '3', rounded: 'md', overflowY: 'auto', maxH: '48' }),
  sidebar: css({ display: 'flex', flexDirection: 'column', gap: '6' }),
  summaryRow: css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }),
  summaryValue: css({ fontWeight: 'medium' }),
  successText: css({ color: 'green.9', fontWeight: 'medium' }),
  blockLink: css({ color: 'colorPalette.default', _hover: { color: 'colorPalette.emphasized' } }),
}
