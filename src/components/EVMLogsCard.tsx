import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronRight, Copy, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { css } from '@/styled-system/css'
import type { EvmLog } from '@/lib/api'

interface EVMLogsCardProps {
	logs: EvmLog[]
}

// Known event signatures
const KNOWN_EVENTS: Record<string, string> = {
	'0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef': 'Transfer(address,address,uint256)',
	'0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925': 'Approval(address,address,uint256)',
}

function getEventName(topic0: string): string {
	return KNOWN_EVENTS[topic0.toLowerCase()] || 'Unknown Event'
}

function formatAddress(addr: string): string {
	if (!addr || addr.length < 10) return addr
	return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export function EVMLogsCard({ logs }: EVMLogsCardProps) {
	const [copied, setCopied] = useState<string | null>(null)
	const [expandedLogs, setExpandedLogs] = useState<Record<number, boolean>>({})

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

	if (logs.length === 0) {
		return null
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className={css({ fontSize: 'lg' })}>EVM Logs ({logs.length})</CardTitle>
			</CardHeader>
			<CardContent className={css({ display: 'flex', flexDir: 'column', gap: '2' })}>
				{logs.map((log, idx) => {
					const isExpanded = expandedLogs[idx]
					const eventName = log.topics.length > 0 ? getEventName(log.topics[0]) : 'No Topics'

					return (
						<Collapsible
							key={idx}
							open={isExpanded}
							onOpenChange={() => setExpandedLogs(prev => ({ ...prev, [idx]: !prev[idx] }))}
						>
							<div className={css({ border: '1px solid', borderColor: 'border.default', rounded: 'lg', overflow: 'hidden' })}>
								<CollapsibleTrigger className={css({ w: 'full', p: '3', _hover: { bg: 'bg.muted/50' }, transition: 'colors' })}>
									<div className={css({ display: 'flex', alignItems: 'center', justifyContent: 'space-between' })}>
										<div className={css({ display: 'flex', alignItems: 'center', gap: '3' })}>
											{isExpanded ? (
												<ChevronDown className={css({ h: '4', w: '4', color: 'fg.muted' })} />
											) : (
												<ChevronRight className={css({ h: '4', w: '4', color: 'fg.muted' })} />
											)}
											<div className={css({ textAlign: 'left' })}>
												<div className={css({ display: 'flex', alignItems: 'center', gap: '2' })}>
													<Badge variant="outline" className={css({ fontFamily: 'mono', fontSize: 'xs' })}>
														#{log.logIndex}
													</Badge>
													<span className={css({ fontSize: 'sm', fontWeight: 'medium' })}>{eventName}</span>
												</div>
												<div className={css({ fontSize: 'xs', color: 'fg.muted', mt: '1' })}>
													Contract: {formatAddress(log.address)}
												</div>
											</div>
										</div>
										<div className={css({ fontSize: 'xs', color: 'fg.muted' })}>
											{log.topics.length} topics
										</div>
									</div>
								</CollapsibleTrigger>

								<CollapsibleContent>
									<div className={css({ px: '3', pb: '3', display: 'flex', flexDir: 'column', gap: '3', borderTop: '1px solid', borderColor: 'border.default' })}>
										{/* Contract Address */}
										<div className={css({ pt: '3' })}>
											<label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'fg.muted' })}>Contract Address</label>
											<div className={css({ display: 'flex', alignItems: 'center', gap: '1', mt: '1' })}>
												<code className={css({ fontSize: 'xs', bg: 'bg.muted', px: '2', py: '1', rounded: 'md' })}>{log.address}</code>
												<CopyButton text={log.address} field={`log-${idx}-address`} />
											</div>
										</div>

										{/* Topics */}
										{log.topics.length > 0 && (
											<div>
												<label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'fg.muted' })}>
													Topics ({log.topics.length})
												</label>
												<div className={css({ display: 'flex', flexDir: 'column', gap: '1', mt: '1' })}>
													{log.topics.map((topic, topicIdx) => (
														<div key={topicIdx} className={css({ display: 'flex', alignItems: 'start', gap: '2' })}>
															<span className={css({ fontSize: 'xs', color: 'fg.muted', minW: '60px' })}>
																[{topicIdx}]
															</span>
															<div className={css({ display: 'flex', alignItems: 'center', gap: '1', flex: '1' })}>
																<code className={css({ fontSize: 'xs', bg: 'bg.muted', px: '2', py: '1', rounded: 'md', wordBreak: 'break-all', flex: '1' })}>
																	{topic}
																</code>
																<CopyButton text={topic} field={`log-${idx}-topic-${topicIdx}`} />
															</div>
														</div>
													))}
												</div>
											</div>
										)}

										{/* Data */}
										{log.data && log.data !== '0x' && (
											<div>
												<label className={css({ fontSize: 'xs', fontWeight: 'medium', color: 'fg.muted' })}>Data</label>
												<div className={css({ display: 'flex', alignItems: 'center', gap: '1', mt: '1' })}>
													<code className={css({ fontSize: 'xs', bg: 'bg.muted', px: '2', py: '1', rounded: 'md', wordBreak: 'break-all', flex: '1' })}>
														{log.data}
													</code>
													<CopyButton text={log.data} field={`log-${idx}-data`} />
												</div>
												<div className={css({ fontSize: 'xs', color: 'fg.muted', mt: '1' })}>
													{(log.data.length - 2) / 2} bytes
												</div>
											</div>
										)}
									</div>
								</CollapsibleContent>
							</div>
						</Collapsible>
					)
				})}
			</CardContent>
		</Card>
	)
}
