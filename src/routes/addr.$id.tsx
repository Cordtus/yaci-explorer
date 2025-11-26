import { useQuery } from "@tanstack/react-query"
import {
	Activity,
	ArrowDownLeft,
	ArrowLeft,
	ArrowUpRight,
	CheckCircle,
	Copy,
	User
} from "lucide-react"
import { useEffect, useState } from "react"
import { Link, useParams } from "react-router"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from "@/components/ui/table"
import { api } from "@/lib/api"
import { formatHash, formatNumber, formatTimeAgo } from "@/lib/utils"
import { css } from "@/styled-system/css"
import type { EnhancedTransaction } from "@/types/blockchain"

/**
 * Address detail page component
 * Displays address statistics and transaction history for a blockchain address
 */
export const AddressPage = () => {
	const [mounted, setMounted] = useState(false)
	const [copied, setCopied] = useState(false)
	const [page, setPage] = useState(0)
	const params = useParams()
	const pageSize = 20

	useEffect(() => {
		setMounted(true)
	}, [])

	// Fetch address statistics
	const { data: stats, isLoading: statsLoading } = useQuery({
		queryKey: ["address-stats", params.id],
		queryFn: async () => {
			if (!params.id) {
				throw new Error("param id not set")
			}
			return await api.getAddressStats(params.id)
		},
		enabled: mounted && !!params.id
	})

	// Fetch transactions for this address
	const { data: transactions, isLoading: txLoading } = useQuery({
		queryKey: ["address-transactions", params.id, page],
		queryFn: async () => {
			if (!params.id) {
				throw new Error("param id not set")
			}
			return await api.getTransactionsByAddress(
				params.id,
				pageSize,
				page * pageSize
			)
		},
		enabled: mounted && !!params.id
	})

	/**
	 * Copies text to clipboard and shows confirmation
	 * @param text - Text to copy to clipboard
	 */
	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	/**
	 * Determines if the address is the sender in a transaction
	 * @param tx - Transaction to check
	 * @returns True if the address is the sender
	 */
	const isSender = (tx: EnhancedTransaction): boolean => {
		return tx.messages?.some((msg) => msg.sender === params.id) ?? false
	}

	if (!mounted || statsLoading) {
		return (
			<div className={styles.stack4}>
				<Skeleton className={css({ h: "8", w: "48" })} />
				<Skeleton className={css({ h: "32", w: "full" })} />
				<Skeleton className={css({ h: "96", w: "full" })} />
			</div>
		)
	}

	if (!stats) {
		return (
			<div className={styles.stack4}>
				<Link to="/" className={styles.backLink}>
					<ArrowLeft className={styles.iconSm} />
					Back to Home
				</Link>
				<Card>
					<CardContent className={styles.cardPadTop}>
						<div className={styles.centeredEmpty}>
							<User className={styles.emptyIcon} />
							<h2 className={styles.errorTitle}>Address Not Found</h2>
							<p className={styles.mutedText}>
								No transactions found for this address.
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<div className={styles.page}>
			{/* Header */}
			<div>
				<Link to="/" className={styles.backLink}>
					<ArrowLeft className={styles.iconSm} />
					Back to Home
				</Link>
				<div className={styles.headerRow}>
					<User className={styles.headerIcon} />
					<h1 className={styles.title}>Address Details</h1>
				</div>
				<div className={styles.addressChip}>
					<p className={styles.codeMono}>{params.id}</p>
					<Button
						variant="ghost"
						size="icon"
						className={styles.copyButton}
						onClick={() => {
							if (!params.id) {
								throw new Error("param id not set")
							}
							copyToClipboard(params.id)
						}}
					>
						{copied ? (
							<CheckCircle className={styles.iconSm} />
						) : (
							<Copy className={styles.iconSm} />
						)}
					</Button>
				</div>
			</div>

			{/* Statistics Cards */}
			<div className={styles.statsGrid}>
				<Card>
					<CardHeader className={styles.statHeader}>
						<CardTitle className={styles.statTitle}>
							Total Transactions
						</CardTitle>
						<Activity className={styles.iconSm} />
					</CardHeader>
					<CardContent>
						<div className={styles.statValue}>
							{formatNumber(stats.transaction_count)}
						</div>
						<p className={styles.statMeta}>
							All transactions involving this address
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className={styles.statHeader}>
						<CardTitle className={styles.statTitle}>Messages Sent</CardTitle>
						<ArrowUpRight className={styles.iconSm} />
					</CardHeader>
					<CardContent>
						<div className={styles.statValue}>
							{formatNumber(stats.total_sent)}
						</div>
						<p className={styles.statMeta}>
							Messages originated from this address
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className={styles.statHeader}>
						<CardTitle className={styles.statTitle}>
							Messages Received
						</CardTitle>
						<ArrowDownLeft className={styles.iconSm} />
					</CardHeader>
					<CardContent>
						<div className={styles.statValue}>
							{formatNumber(stats.total_received)}
						</div>
						<p className={styles.statMeta}>Messages mentioning this address</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className={styles.statHeader}>
						<CardTitle className={styles.statTitle}>First Seen</CardTitle>
						<CheckCircle className={styles.iconSm} />
					</CardHeader>
					<CardContent>
						<div className={styles.statValueLg}>
							{stats.first_seen ? formatTimeAgo(stats.first_seen) : "N/A"}
						</div>
						<p className={styles.statMeta}>
							{stats.first_seen
								? new Date(stats.first_seen).toLocaleDateString()
								: "No activity"}
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Transactions Table */}
			<Card>
				<CardHeader>
					<CardTitle>Transaction History</CardTitle>
					<p className="text-sm text-muted-foreground">
						All transactions involving this address
					</p>
				</CardHeader>
				<CardContent>
					{txLoading ? (
						<div className={styles.stack3}>
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
						</div>
					) : transactions && transactions.data.length > 0 ? (
						<>
							<div className={styles.tableShell}>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Type</TableHead>
											<TableHead>Tx Hash</TableHead>
											<TableHead>Block</TableHead>
											<TableHead>Messages</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Time</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{transactions.data.map((tx) => {
											const isOut = isSender(tx)
											const isSuccess = !tx.error

											return (
												<TableRow key={tx.id}>
													<TableCell>
														<Badge
															variant={isOut ? "default" : "secondary"}
															className={cn(
																"font-medium",
																isOut
																	? "bg-blue-500 hover:bg-blue-600"
																	: "bg-green-500 hover:bg-green-600"
															)}
														>
															{isOut ? (
																<>
																	<ArrowUpRight className="h-3 w-3 mr-1" />
																	OUT
																</>
															) : (
																<>
																	<ArrowDownLeft className="h-3 w-3 mr-1" />
																	IN
																</>
															)}
														</Badge>
													</TableCell>
													<TableCell>
														<Link
															to={`/transactions/${tx.id}`}
															className="font-mono text-sm text-primary hover:text-primary/80"
														>
															{formatHash(tx.id, 8)}
														</Link>
													</TableCell>
													<TableCell>
														<Link
															to={`/blocks/${tx.height}`}
															className={styles.blockLink}
														>
															{formatNumber(tx.height)}
														</Link>
													</TableCell>
													<TableCell>
														<Badge variant="outline">
															{tx.messages?.length || 0}
														</Badge>
													</TableCell>
													<TableCell>
														<Badge
															variant={isSuccess ? "success" : "destructive"}
														>
															{isSuccess ? (
																<>
																	<CheckCircle className="h-3 w-3 mr-1" />
																	Success
																</>
															) : (
																"Failed"
															)}
														</Badge>
													</TableCell>
													<TableCell className={styles.metaCell}>
														{formatTimeAgo(tx.timestamp)}
													</TableCell>
												</TableRow>
											)
										})}
									</TableBody>
								</Table>
							</div>

							{/* Pagination */}
							{transactions.pagination.total > pageSize && (
								<div className={styles.paginationRow}>
									<div className={styles.metaText}>
										Showing {page * pageSize + 1} to{" "}
										{Math.min(
											(page + 1) * pageSize,
											transactions.pagination.total
										)}{" "}
										of {transactions.pagination.total} transactions
									</div>
									<div className={styles.rowGap2}>
										<Button
											variant="outline"
											size="sm"
											onClick={() => setPage((p) => Math.max(0, p - 1))}
											disabled={!transactions.pagination.has_prev}
										>
											Previous
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => setPage((p) => p + 1)}
											disabled={!transactions.pagination.has_next}
										>
											Next
										</Button>
									</div>
								</div>
							)}
						</>
					) : (
						<div className={styles.centeredEmpty}>
							<Activity className={styles.emptyIcon} />
							<p className={styles.mutedText}>
								No transactions found for this address
							</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}

const styles = {
	page: css({ display: "flex", flexDirection: "column", gap: "6" }),
	stack4: css({ display: "flex", flexDirection: "column", gap: "4" }),
	stack3: css({ display: "flex", flexDirection: "column", gap: "3" }),
	rowGap2: css({ display: "flex", alignItems: "center", gap: "2" }),
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
	emptyIcon: css({ h: "12", w: "12", color: "fg.muted" }),
	errorTitle: css({ fontSize: "2xl", fontWeight: "bold", color: "fg.muted" }),
	mutedText: css({ color: "fg.muted" }),
	iconSm: css({ h: "4", w: "4" }),
	iconXs: css({ h: "3", w: "3", mr: "1" }),
	headerRow: css({ display: "flex", alignItems: "center", gap: "3", mb: "2" }),
	headerIcon: css({ h: "8", w: "8", color: "colorPalette.default" }),
	title: css({ fontSize: "3xl", fontWeight: "bold" }),
	addressChip: css({
		display: "flex",
		alignItems: "center",
		gap: "2",
		bg: "bg.muted",
		p: "3",
		rounded: "lg"
	}),
	codeMono: css({
		fontFamily: "mono",
		fontSize: "sm",
		wordBreak: "break-all",
		flex: "1"
	}),
	copyButton: css({ h: "8", w: "8", flexShrink: 0 }),
	statsGrid: css({
		display: "grid",
		gap: "4",
		gridTemplateColumns: {
			base: "1fr",
			md: "repeat(2, minmax(0, 1fr))",
			lg: "repeat(4, minmax(0, 1fr))"
		}
	}),
	statHeader: css({
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		pb: "2"
	}),
	statTitle: css({ fontSize: "sm", fontWeight: "medium" }),
	statValue: css({ fontSize: "2xl", fontWeight: "bold" }),
	statValueLg: css({ fontSize: "lg", fontWeight: "bold" }),
	statMeta: css({ fontSize: "xs", color: "fg.muted", mt: "1" }),
	tableShell: css({ rounded: "md", borderWidth: "1px", overflowX: "auto" }),
	badgeOut: css({
		fontWeight: "medium",
		bg: "blue.8",
		color: "white",
		_hover: { bg: "blue.9" }
	}),
	badgeIn: css({
		fontWeight: "medium",
		bg: "green.8",
		color: "white",
		_hover: { bg: "green.9" }
	}),
	txLink: css({
		fontFamily: "mono",
		fontSize: "sm",
		color: "colorPalette.default",
		_hover: { color: "colorPalette.emphasized" }
	}),
	blockLink: css({
		color: "colorPalette.default",
		_hover: { color: "colorPalette.emphasized" }
	}),
	metaCell: css({ fontSize: "sm", color: "fg.muted" }),
	paginationRow: css({
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		mt: "4"
	}),
	metaText: css({ color: "fg.muted" })
}
