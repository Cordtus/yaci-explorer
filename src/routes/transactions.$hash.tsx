import { useQuery } from "@tanstack/react-query"
import {
	ArrowLeft,
	CheckCircle,
	ChevronDown,
	ChevronRight,
	Code,
	Copy,
	Eye,
	XCircle
} from "lucide-react"
import { useEffect, useState } from "react"
import { Link, useParams } from "react-router"
import { AddressChip } from "@/components/AddressChip"
import { EVMLogsCard } from "@/components/EVMLogsCard"
import { EVMTransactionCard } from "@/components/EVMTransactionCard"
import { JsonViewer } from "@/components/JsonViewer"
import { MessageDetails } from "@/components/MessageDetails"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger
} from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from "@/components/ui/table"
import { YaciAPIClient } from "@/lib/api/client"
import { formatHash, formatNumber, formatTimeAgo } from "@/lib/utils"
import { css } from "@/styled-system/css"

// Helper to group events by event_index, then by attributes
function groupEvents(events: any[]) {
	const grouped = new Map<
		number,
		{
			event_type: string
			msg_index: number | null
			attributes: Map<string, string>
		}
	>()

	events.forEach((event) => {
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
		attributes: Array.from(data.attributes.entries()).map(([key, value]) => ({
			key,
			value
		}))
	}))
}

// Accent colors for different message types
const MESSAGE_COLORS = [
	"blue.8",
	"violet.8",
	"green.8",
	"orange.8",
	"pink.8",
	"cyan.8",
	"indigo.8",
	"teal.8"
]

// Helper to check if a string is valid JSON
function isJsonString(str: string): boolean {
	try {
		const parsed = JSON.parse(str)
		return typeof parsed === "object" && parsed !== null
	} catch {
		return false
	}
}

export default function TransactionDetailPage() {
	const [mounted, setMounted] = useState(false)
	const [showRawData, setShowRawData] = useState<Record<number, boolean>>({})
	const [copied, setCopied] = useState(false)
	const [expandedMessages, setExpandedMessages] = useState<
		Record<number, boolean>
	>({})
	const [expandedEventTypes, setExpandedEventTypes] = useState<
		Record<string, boolean>
	>({})
	const [eventFilter, setEventFilter] = useState("")
	const [evmView, setEvmView] = useState(false)
	const [isDecodingEVM, setIsDecodingEVM] = useState(false)
	const [decodeAttempted, setDecodeAttempted] = useState(false)
	const params = useParams()
	const [searchParams] = useSearchParams()

	useEffect(() => {
		setMounted(true)
		// Auto-enable EVM view if searched by EVM hash
		if (searchParams.get("evm") === "true") {
			setEvmView(true)
		}
	}, [searchParams])

	const {
		data: transaction,
		isLoading,
		error,
		refetch
	} = useQuery({
		queryKey: ["transaction", params.hash],
		queryFn: async () => {
			const result = await api.getTransaction(params.hash!)
			return result
		},
		enabled: mounted && !!params.hash,
		refetchInterval: isDecodingEVM ? 2000 : false
	})

	useEffect(() => {
		if (!transaction || decodeAttempted) return

		const isEVMTransaction = transaction.messages?.some(
			(msg) => msg.type === "/ethermint.evm.v1.MsgEthereumTx"
		)

		if (isEVMTransaction && !transaction.evm_data) {
			setIsDecodingEVM(true)
			setDecodeAttempted(true)

			const apiURL = import.meta.env.VITE_POSTGREST_URL || "/api"

			fetch(`${apiURL}/rpc/request_evm_decode`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Prefer: "params=single-object"
				},
				body: JSON.stringify({ _tx_id: transaction.id })
			})
				.then((res) => res.json())
				.then((data) => {
					console.log("Priority EVM decode requested:", data.message)
					if (data.success && data.status !== "not_found") {
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
					console.error("Failed to request priority decode:", err)
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
		setShowRawData((prev) => ({
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
							<XCircle className={css({ h: "12", w: "12", color: "red.8" })} />
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
				<Skeleton className={css({ h: "8", w: "48" })} />
				<Skeleton className={css({ h: "64", w: "full" })} />
				<Skeleton className={css({ h: "96", w: "full" })} />
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
		<div className={styles.page}>
			{/* Header */}
			<div>
				<Link to="/transactions" className={styles.backLink}>
					<ArrowLeft className={styles.iconSm} />
					Back to Transactions
				</Link>
				<div className={styles.headerRow}>
					<h1 className={styles.title}>Transaction</h1>
					<Badge variant={isSuccess ? "success" : "destructive"}>
						{isSuccess ? (
							<>
								<CheckCircle className={styles.iconXs} /> Success
							</>
						) : (
							<>
								<XCircle className={styles.iconXs} /> Failed
							</>
						)}
					</Badge>
				</div>
				<div className={styles.txIdRow}>
					<p className={styles.codeSmMuted}>{transaction.id}</p>
					<Button
						variant="ghost"
						size="icon"
						className={styles.copyButton}
						onClick={() => copyToClipboard(transaction.id)}
					>
						{copied ? (
							<CheckCircle className={styles.iconXs} />
						) : (
							<Copy className={styles.iconXs} />
						)}
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
								<>
									<ToggleRight className="h-4 w-4" /> EVM View
								</>
							) : (
								<>
									<ToggleLeft className="h-4 w-4" /> Cosmos View
								</>
							)}
						</Button>
						<span className="text-xs text-muted-foreground">
							{evmView
								? "Showing EVM transaction details"
								: "Showing Cosmos SDK transaction details"}
						</span>
					</div>
				)}

				{/* EVM Decoding Status */}
				{isDecodingEVM && (
					<div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
						<Loader2 className="h-4 w-4 animate-spin" />
						<span>Decoding EVM transaction data...</span>
					</div>
				)}

				{transaction.ingest_error && (
					<div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
						<p className="font-semibold">Partial transaction data</p>
						<p className="mt-1">
							The indexer could not fetch full transaction details from the gRPC
							node. Reason:{" "}
							{transaction.ingest_error.reason ||
								transaction.ingest_error.message}
							. Only the hash and error metadata are available.
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
									{transaction.timestamp ? (
										<>
											<p className={styles.textSm}>
												{formatTimeAgo(transaction.timestamp)}
											</p>
											<p className={styles.metaText}>
												{new Date(transaction.timestamp).toLocaleString()}
											</p>
										</>
									) : (
										<p className="text-sm text-muted-foreground">Unavailable</p>
									)}
								</div>
								<div>
									<label className={styles.label}>Fee</label>
									<p className={styles.textSm}>
										{feeAmounts.length > 0
											? feeAmounts.map((fee: any, idx: number) => (
													<span key={idx}>
														{formatNumber(fee.amount)} {fee.denom}
														{idx < feeAmounts.length - 1 && ", "}
													</span>
												))
											: "N/A"}
									</p>
								</div>
								<div>
									<label className="text-sm font-medium text-muted-foreground">
										Gas Limit
									</label>
									<p className="text-sm">
										{transaction.fee?.gasLimit
											? formatNumber(transaction.fee.gasLimit)
											: "N/A"}
									</p>
								</div>
							</div>

							{transaction.memo && (
								<div className={styles.memo}>
									<label className={styles.label}>Memo</label>
									<p className={styles.memoText}>{transaction.memo}</p>
								</div>
							)}

							{transaction.error && (
								<div className={styles.errorBox}>
									<label className={styles.label}>Error</label>
									<p className={styles.errorPill}>{transaction.error}</p>
								</div>
							)}

							{/* Dynamic Message-Specific Details */}
							{transaction.messages && transaction.messages.length > 0 && (
								<div className={styles.stack4}>
									<div className={styles.topDivider}>
										<p className={styles.label}>Transaction Details</p>
										{transaction.messages.map((message) => {
											const messageEvents =
												transaction.events?.filter(
													(e) =>
														e.msg_index === msgIdx ||
														(e.msg_index === null && msgIdx === 0)
												) || []
											const groupedEvents = groupEvents(messageEvents)

											return (
												<div key={msgIdx} className={styles.messageBlock}>
													{msgIdx > 0 && <div className={styles.divider} />}
													<MessageDetails
														type={message.type ?? "Unknown"}
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
					{/* Messages & Events - Nested View */}
					<Card>
						<CardHeader>
							<CardTitle>
								Messages & Events ({transaction.messages?.length || 0} messages)
							</CardTitle>
						</CardHeader>
						<CardContent>
							{transaction.messages && transaction.messages.length > 0 ? (
								<div className={styles.stack3}>
									{transaction.messages.map((message, msgIdx) => {
										const messageColor =
											MESSAGE_COLORS[msgIdx % MESSAGE_COLORS.length]
										const messageEvents =
											transaction.events?.filter(
												(e) =>
													e.msg_index === msgIdx ||
													(e.msg_index === null && msgIdx === 0)
											) || []
										const groupedEvents = groupEvents(messageEvents)
										const isExpanded = expandedMessages[msgIdx]

										return (
											<Collapsible
												key={msgIdx}
												open={isExpanded}
												onOpenChange={() =>
													setExpandedMessages((prev) => ({
														...prev,
														[msgIdx]: !prev[msgIdx]
													}))
												}
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
																<span className="text-sm font-medium">
																	Message #{msgIdx}
																</span>
																<Badge
																	variant="outline"
																	className="font-mono text-xs"
																>
																	{message.type || "Unknown"}
																</Badge>
																{groupedEvents.length > 0 && (
																	<Badge
																		variant="secondary"
																		className="text-xs"
																	>
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
																	<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
																		Sender
																	</p>
																	<div className="flex items-center gap-2 mt-1">
																		<code className="text-sm font-mono">
																			{message.sender}
																		</code>
																		<Button
																			variant="ghost"
																			size="icon"
																			className="h-5 w-5"
																			onClick={() =>
																				message.sender &&
																				copyToClipboard(message.sender)
																			}
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
																		const isEventExpanded =
																			expandedEvents[eventKey]

																		return (
																			<Collapsible
																				key={eventKey}
																				open={isEventExpanded}
																				onOpenChange={() =>
																					setExpandedEvents((prev) => ({
																						...prev,
																						[eventKey]: !prev[eventKey]
																					}))
																				}
																			>
																				<div className="border rounded-lg overflow-hidden bg-card">
																					<div
																						className={`h-0.5 ${messageColor} opacity-60 w-1/4`}
																					/>

																					<CollapsibleTrigger className="w-full p-3 hover:bg-muted/30 transition-colors">
																						<div className="flex items-center justify-between text-left">
																							<div className="flex items-center gap-2">
																								{isEventExpanded ? (
																									<ChevronDown className="h-3 w-3 text-muted-foreground" />
																								) : (
																									<ChevronRight className="h-3 w-3 text-muted-foreground" />
																								)}
																								<Badge
																									variant="outline"
																									className="text-xs"
																								>
																									{event.event_type}
																								</Badge>
																								<span className="text-xs text-muted-foreground">
																									{event.attributes.length}{" "}
																									attributes
																								</span>
																							</div>
																						</div>
																					</CollapsibleTrigger>

																					<CollapsibleContent>
																						<div className="px-3 pb-3 space-y-2">
																							{event.attributes.map((attr) => {
																								const isJson = isJsonString(
																									attr.value
																								)

																								return (
																									<div
																										key={attr.key}
																										className={
																											isJson
																												? "bg-muted/20 rounded p-2"
																												: "bg-muted/20 rounded p-2"
																										}
																									>
																										<div className="flex flex-col gap-2">
																											<span className="text-xs font-medium text-muted-foreground">
																												{attr.key}:
																											</span>
																											{isJson ? (
																												<JsonViewer
																													data={attr.value}
																													maxHeight={400}
																												/>
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

															<div className={css({ pt: "2" })}>
																<Button
																	variant="outline"
																	size="sm"
																	onClick={() => toggleRawData(msgIdx)}
																	className={styles.fullWidth}
																>
																	{showRawData[msgIdx] ? (
																		<Eye className={styles.iconSm} />
																	) : (
																		<Code className={styles.iconSm} />
																	)}
																	{showRawData[msgIdx] ? "Hide" : "Show"} Raw
																	Data
																</Button>
																{showRawData[msgIdx] && message.data && (
																	<div className={styles.rawBox}>
																		<pre>
																			{JSON.stringify(message.data, null, 2)}
																		</pre>
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
									No messages found
								</p>
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
									<span
										className={
											isSuccess ? styles.successText : styles.errorText
										}
									>
										{isSuccess ? "Success" : "Failed"}
									</span>
								</div>
								<div className={styles.summaryRow}>
									<span className={styles.mutedText}>Messages</span>
									<span className={styles.summaryValue}>
										{transaction.messages?.length || 0}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Events</span>
									<span className="font-medium">
										{transaction.events?.length || 0}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Block</span>
									<Link
										to={`/blocks/${transaction.height}`}
										className="font-medium text-primary hover:text-primary/80"
									>
										#{formatNumber(transaction.height)}
									</Link>
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
											<p className="text-muted-foreground">EVM Hash</p>
											<p className="font-mono text-xs break-all">
												{transaction.evm_data.hash}
											</p>
										</div>
									)}
									{transaction.evm_data.from_address && (
										<div>
											<p className="text-muted-foreground">From</p>
											<p className="font-mono text-xs">
												{formatHash(transaction.evm_data.from_address, 8)}
											</p>
										</div>
									)}
									{transaction.evm_data.to_address && (
										<div>
											<p className="text-muted-foreground">To</p>
											<p className="font-mono text-xs">
												{formatHash(transaction.evm_data.to_address, 8)}
											</p>
										</div>
									)}
									{transaction.evm_data.gas_used && (
										<div>
											<p className="text-muted-foreground">Gas Used</p>
											<p className="font-mono text-xs">
												{formatNumber(transaction.evm_data.gas_used)}
											</p>
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
	page: css({ display: "flex", flexDirection: "column", gap: "6" }),
	stack4: css({ display: "flex", flexDirection: "column", gap: "4" }),
	stack3: css({ display: "flex", flexDirection: "column", gap: "3" }),
	backLink: css({
		display: "inline-flex",
		alignItems: "center",
		gap: "2",
		color: "fg.muted",
		_hover: { color: "fg.default" },
		mb: "4"
	}),
	cardPadTop: css({ pt: "6" }),
	centeredEmpty: css({
		textAlign: "center",
		py: "12",
		display: "flex",
		flexDirection: "column",
		gap: "3",
		alignItems: "center"
	}),
	errorTitle: css({ fontSize: "2xl", fontWeight: "bold", color: "red.8" }),
	mutedText: css({ color: "fg.muted" }),
	errorText: css({ color: "red.8", fontSize: "sm" }),
	iconSm: css({ h: "4", w: "4" }),
	iconXs: css({ h: "3", w: "3", mr: "1" }),
	headerRow: css({
		display: "flex",
		alignItems: "center",
		gap: "3",
		mb: "2"
	}),
	title: css({ fontSize: "3xl", fontWeight: "bold" }),
	txIdRow: css({ display: "flex", alignItems: "center", gap: "2" }),
	copyButton: css({ h: "6", w: "6" }),
	codeSmMuted: css({
		fontFamily: "mono",
		fontSize: "sm",
		color: "fg.muted",
		wordBreak: "break-all"
	}),
	layoutGrid: css({
		display: "grid",
		gap: "6",
		gridTemplateColumns: { base: "1fr", lg: "2fr 1fr" }
	}),
	mainCol: css({ display: "flex", flexDirection: "column", gap: "6" }),
	link: css({
		color: "colorPalette.default",
		_hover: { color: "colorPalette.emphasized" }
	}),
	infoGrid: css({
		display: "grid",
		gap: "4",
		gridTemplateColumns: { base: "1fr", md: "repeat(2, minmax(0, 1fr))" }
	}),
	label: css({ fontSize: "sm", fontWeight: "medium", color: "fg.muted" }),
	valueLg: css({ fontSize: "lg", fontWeight: "bold" }),
	textSm: css({ fontSize: "sm" }),
	metaText: css({ fontSize: "xs", color: "fg.muted" }),
	memo: css({ mt: "4" }),
	memoText: css({
		fontSize: "sm",
		bg: "bg.muted",
		p: "3",
		rounded: "md",
		fontFamily: "mono",
		mt: "1"
	}),
	errorBox: css({ mt: "4" }),
	errorPill: css({
		fontSize: "sm",
		bg: "red.1",
		color: "red.11",
		p: "3",
		rounded: "md",
		mt: "1"
	}),
	topDivider: css({ borderTopWidth: "1px", pt: "4" }),
	messageBlock: css({ mb: "4" }),
	divider: css({ borderTopWidth: "1px", my: "4" }),
	panel: css({
		borderWidth: "1px",
		rounded: "lg",
		overflow: "hidden",
		bg: "bg.default"
	}),
	trigger: css({
		width: "100%",
		px: "4",
		py: "3.5",
		textAlign: "left",
		transition: "all 0.2s ease",
		_hover: { bg: "bg.muted" }
	}),
	triggerInner: css({ display: "flex", alignItems: "center", gap: "3" }),
	textSmBold: css({ fontSize: "sm", fontWeight: "medium" }),
	badgeXs: css({ fontSize: "xs" }),
	panelBody: css({
		px: "4",
		pb: "4",
		display: "flex",
		flexDirection: "column",
		gap: "4"
	}),
	cardMuted: css({
		bg: "bg.muted",
		rounded: "lg",
		p: "3",
		display: "flex",
		flexDirection: "column",
		gap: "1"
	}),
	labelUpper: css({
		fontSize: "xs",
		fontWeight: "medium",
		color: "fg.muted",
		textTransform: "uppercase",
		letterSpacing: "widest"
	}),
	codeSm: css({ fontFamily: "mono", fontSize: "sm" }),
	iconButton: css({ h: "5", w: "5", p: "0" }),
	eventList: css({
		display: "flex",
		flexDirection: "column",
		gap: "2",
		pl: "4",
		borderLeftWidth: "2px",
		borderColor: "border.subtle"
	}),
	eventPanel: css({
		borderWidth: "1px",
		rounded: "lg",
		overflow: "hidden",
		bg: "bg.card"
	}),
	eventTrigger: css({
		width: "100%",
		px: "3",
		py: "3",
		textAlign: "left",
		_hover: { bg: "bg.muted" }
	}),
	eventTriggerInner: css({ display: "flex", alignItems: "center", gap: "2" }),
	eventBody: css({
		px: "3",
		pb: "3",
		display: "flex",
		flexDirection: "column",
		gap: "2"
	}),
	attrBox: css({ bg: "bg.muted", rounded: "md", p: "2" }),
	attrContent: css({ display: "flex", flexDirection: "column", gap: "2" }),
	attrLabel: css({ fontSize: "xs", fontWeight: "medium", color: "fg.muted" }),
	attrValue: css({
		fontSize: "xs",
		fontFamily: "mono",
		wordBreak: "break-all"
	}),
	fullWidth: css({ width: "100%", justifyContent: "center", gap: "2" }),
	rawBox: css({
		mt: "2",
		fontSize: "xs",
		bg: "bg.muted",
		p: "3",
		rounded: "md",
		overflowY: "auto",
		maxH: "48"
	}),
	sidebar: css({ display: "flex", flexDirection: "column", gap: "6" }),
	summaryRow: css({
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center"
	}),
	summaryValue: css({ fontWeight: "medium" }),
	successText: css({ color: "green.9", fontWeight: "medium" }),
	blockLink: css({
		color: "colorPalette.default",
		_hover: { color: "colorPalette.emphasized" }
	})
}
