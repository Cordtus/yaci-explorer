import { useQuery } from "@tanstack/react-query"
import { Activity, Check, Filter, X } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pagination } from "@/components/ui/pagination"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from "@/components/ui/table"
import { appConfig } from "@/config/app"
import { api } from "@/lib/api"
import {
	formatHash,
	formatTimeAgo,
	getMessageTypeLabel,
	getTransactionStatus,
	isEVMTransaction
} from "@/lib/utils"
import { css } from "../../styled-system/css"

export default function TransactionsPage() {
	const [page, setPage] = useState(0)
	const [filterOpen, setFilterOpen] = useState(false)

	// Filter state
	const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set())
	const [messageTypeFilters, setMessageTypeFilters] = useState<Set<string>>(
		new Set()
	)
	const [blockFilter, setBlockFilter] = useState("")
	const [blockRangeMin, setBlockRangeMin] = useState("")
	const [blockRangeMax, setBlockRangeMax] = useState("")
	const [timeRangeMin, setTimeRangeMin] = useState("")
	const [timeRangeMax, setTimeRangeMax] = useState("")

	const limit = appConfig.transactions.pageSize

	// Fetch distinct message types dynamically
	const { data: messageTypes = [] } = useQuery({
		queryKey: ["message-types"],
		queryFn: () => api.getDistinctMessageTypes(),
		staleTime: 60000 // Cache for 1 minute
	})

	// Build filters object
	const buildFilters = () => {
		const filters: any = {}

		// Status filter
		if (statusFilters.has("success") && !statusFilters.has("failed")) {
			filters.status = "success"
		} else if (statusFilters.has("failed") && !statusFilters.has("success")) {
			filters.status = "failed"
		}

		// Block filters
		if (blockFilter) {
			const parsed = parseInt(blockFilter)
			if (!isNaN(parsed)) {
				filters.block_height = parsed
			}
		} else {
			if (blockRangeMin) {
				const parsed = parseInt(blockRangeMin)
				if (!isNaN(parsed)) {
					filters.block_height_min = parsed
				}
			}
			if (blockRangeMax) {
				const parsed = parseInt(blockRangeMax)
				if (!isNaN(parsed)) {
					filters.block_height_max = parsed
				}
			}
		}

		// Time range filters
		if (timeRangeMin) {
			filters.timestamp_min = new Date(timeRangeMin).toISOString()
		}
		if (timeRangeMax) {
			filters.timestamp_max = new Date(timeRangeMax).toISOString()
		}

		// Message type filter - only use if exactly one is selected
		if (messageTypeFilters.size === 1) {
			filters.message_type = Array.from(messageTypeFilters)[0]
		}

		return filters
	}

	const { data, isLoading, error } = useQuery({
		queryKey: [
			"transactions",
			page,
			Array.from(statusFilters),
			Array.from(messageTypeFilters),
			blockFilter,
			blockRangeMin,
			blockRangeMax,
			timeRangeMin,
			timeRangeMax
		],
		queryFn: () => api.getTransactions(limit, page * limit, buildFilters())
	})

	const handleClearFilters = () => {
		setStatusFilters(new Set())
		setMessageTypeFilters(new Set())
		setBlockFilter("")
		setBlockRangeMin("")
		setBlockRangeMax("")
		setTimeRangeMin("")
		setTimeRangeMax("")
		setPage(0)
	}

	const handleStatusToggle = (status: string) => {
		const newFilters = new Set(statusFilters)
		if (newFilters.has(status)) {
			newFilters.delete(status)
		} else {
			newFilters.add(status)
		}
		setStatusFilters(newFilters)
	}

	const handleMessageTypeToggle = (type: string) => {
		const newFilters = new Set(messageTypeFilters)
		if (newFilters.has(type)) {
			newFilters.delete(type)
		} else {
			newFilters.add(type)
		}
		setMessageTypeFilters(newFilters)
	}

	const hasActiveFilters =
		statusFilters.size > 0 ||
		messageTypeFilters.size > 0 ||
		blockFilter ||
		blockRangeMin ||
		blockRangeMax ||
		timeRangeMin ||
		timeRangeMax
	const activeFilterCount =
		statusFilters.size +
		messageTypeFilters.size +
		(blockFilter ? 1 : 0) +
		(blockRangeMin || blockRangeMax ? 1 : 0) +
		(timeRangeMin || timeRangeMax ? 1 : 0)

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className={styles.title}>Transactions</h1>
				</div>
				<Dialog open={filterOpen} onOpenChange={setFilterOpen}>
					<DialogTrigger asChild>
						<Button variant="outline" className="gap-2">
							<Filter className="h-4 w-4" />
							Filters
							{activeFilterCount > 0 && (
								<Badge variant="secondary" className="ml-1">
									{activeFilterCount}
								</Badge>
							)}
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>Filter Transactions</DialogTitle>
							<DialogDescription>
								Select filter criteria to narrow down the transaction list
							</DialogDescription>
						</DialogHeader>

						<div className={styles.filterBody}>
							{/* Status Filter */}
							<div className={styles.section}>
								<Label className={styles.sectionTitle}>Status</Label>
								<div className={styles.stack2}>
									<div className={styles.checkRow}>
										<Checkbox
											id="status-success"
											checked={statusFilters.has("success")}
											onCheckedChange={() => handleStatusToggle("success")}
										/>
										<label
											htmlFor="status-success"
											className={styles.checkboxLabel}
										>
											Success
										</label>
									</div>
									<div className={styles.checkRow}>
										<Checkbox
											id="status-failed"
											checked={statusFilters.has("failed")}
											onCheckedChange={() => handleStatusToggle("failed")}
										/>
										<label
											htmlFor="status-failed"
											className={styles.checkboxLabel}
										>
											Failed
										</label>
									</div>
								</div>
							</div>

							<Separator />

							{/* Message Type Filter */}
							<div className={styles.section}>
								<Label className={styles.sectionTitle}>Message Type</Label>
								<div className={styles.scrollList}>
									{messageTypes.length === 0 ? (
										<div className={styles.metaText}>
											Loading message types...
										</div>
									) : (
										messageTypes.map((type) => (
											<div key={type} className={styles.checkRow}>
												<Checkbox
													id={`type-${type}`}
													checked={messageTypeFilters.has(type)}
													onCheckedChange={() => handleMessageTypeToggle(type)}
												/>
												<label
													htmlFor={`type-${type}`}
													className={styles.checkboxLabel}
												>
													{getMessageTypeLabel(type)}
												</label>
											</div>
										))
									)}
								</div>
							</div>

							<Separator />

							{/* Block Height Filter */}
							<div className={styles.section}>
								<Label className={styles.sectionTitle}>Block Height</Label>
								<div className={styles.stack3}>
									<div>
										<Label htmlFor="block-single" className={styles.labelSm}>
											Single Block
										</Label>
										<Input
											id="block-single"
											type="number"
											placeholder="Enter block number"
											value={blockFilter}
											onChange={(e) => {
												setBlockFilter(e.target.value)
												if (e.target.value) {
													setBlockRangeMin("")
													setBlockRangeMax("")
												}
											}}
										/>
									</div>
									<div className={styles.twoCol}>
										<div>
											<Label htmlFor="block-min" className={styles.labelSm}>
												Min Block
											</Label>
											<Input
												id="block-min"
												type="number"
												placeholder="Min"
												value={blockRangeMin}
												onChange={(e) => {
													setBlockRangeMin(e.target.value)
													if (e.target.value) setBlockFilter("")
												}}
												disabled={!!blockFilter}
											/>
										</div>
										<div>
											<Label htmlFor="block-max" className={styles.labelSm}>
												Max Block
											</Label>
											<Input
												id="block-max"
												type="number"
												placeholder="Max"
												value={blockRangeMax}
												onChange={(e) => {
													setBlockRangeMax(e.target.value)
													if (e.target.value) setBlockFilter("")
												}}
												disabled={!!blockFilter}
											/>
										</div>
									</div>
								</div>
							</div>

							<Separator />

							{/* Time Range Filter */}
							<div className={styles.section}>
								<Label className={styles.sectionTitle}>Time Range</Label>
								<div className={styles.twoCol}>
									<div>
										<Label htmlFor="time-min" className={styles.labelSm}>
											From
										</Label>
										<Input
											id="time-min"
											type="datetime-local"
											value={timeRangeMin}
											onChange={(e) => setTimeRangeMin(e.target.value)}
										/>
									</div>
									<div>
										<Label htmlFor="time-max" className={styles.labelSm}>
											To
										</Label>
										<Input
											id="time-max"
											type="datetime-local"
											value={timeRangeMax}
											onChange={(e) => setTimeRangeMax(e.target.value)}
										/>
									</div>
								</div>
							</div>
						</div>

						<DialogFooter>
							<Button variant="outline" onClick={handleClearFilters}>
								Clear All
							</Button>
							<Button
								onClick={() => {
									setFilterOpen(false)
									setPage(0)
								}}
							>
								Apply Filters
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Transactions</CardTitle>
					<CardDescription>
						{data
							? `Showing ${data.data.length} of ${data.pagination.total.toLocaleString()} transactions`
							: "Loading..."}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className={styles.th}>Transaction Hash</TableHead>
								<TableHead className={styles.th}>Type</TableHead>
								<TableHead className={styles.th}>Block</TableHead>
								<TableHead className={styles.th}>Time</TableHead>
								<TableHead className={styles.th}>Status</TableHead>
								<TableHead className={styles.th}>Fee</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{isLoading ? (
								Array.from({ length: 10 }).map((_, i) => (
									<TableRow key={i}>
										<TableCell colSpan={6}>
											<Skeleton className={css({ h: "12", w: "full" })} />
										</TableCell>
									</TableRow>
								))
							) : error ? (
								<TableRow>
									<TableCell colSpan={6} className={styles.mutedCentered}>
										Error loading transactions
									</TableCell>
								</TableRow>
							) : data?.data.length === 0 ? (
								<TableRow>
									<TableCell colSpan={6} className={styles.emptyState}>
										No transactions found matching your filters
									</TableCell>
								</TableRow>
							) : (
								data?.data.map((tx) => {
									const status = getTransactionStatus(tx.error)
									const isEVM = isEVMTransaction(tx.messages)

									return (
										<TableRow key={tx.id}>
											<TableCell>
												<Link
													to={`/transactions/${tx.id}`}
													className="flex items-center gap-2 font-medium hover:text-primary"
												>
													<Activity className="h-4 w-4" />
													<code className="text-xs">
														{formatHash(tx.id, 10)}
													</code>
												</Link>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													{isEVM && (
														<Badge variant="outline" className="text-xs">
															EVM
														</Badge>
													)}
													<span className="text-sm">
														{tx.messages.length > 0
															? getMessageTypeLabel(tx.messages[0].type || "")
															: "Unknown"}
													</span>
													{tx.messages.length > 1 && (
														<Badge variant="secondary" className="text-xs">
															+{tx.messages.length - 1}
														</Badge>
													)}
												</div>
											</TableCell>
											<TableCell>
												{tx.height ? (
													<Link
														to={`/blocks/${tx.height}`}
														className={styles.textLink}
													>
														{tx.height}
													</Link>
												) : (
													<span className="text-sm text-muted-foreground">
														-
													</span>
												)}
											</TableCell>
											<TableCell>
												<div>
													<div className="text-sm">
														{formatTimeAgo(tx.timestamp)}
													</div>
												</div>
											</TableCell>
											<TableCell>
												<Badge
													variant={tx.error ? "destructive" : "success"}
													className="flex items-center gap-1 w-fit"
												>
													{tx.error ? (
														<X className="h-3 w-3" />
													) : (
														<Check className="h-3 w-3" />
													)}
													{status.label}
												</Badge>
											</TableCell>
											<TableCell>
												<div className="text-sm">
													{tx.fee?.amount?.[0]?.amount || "0"}{" "}
													{tx.fee?.amount?.[0]?.denom || ""}
												</div>
											</TableCell>
										</TableRow>
									)
								})
							)}
						</TableBody>
					</Table>

					{data && data.pagination.total > 0 && (
						<Pagination
							currentPage={page}
							totalPages={Math.ceil(data.pagination.total / limit)}
							onPageChange={setPage}
							isLoading={isLoading}
						/>
					)}
				</CardContent>
			</Card>
		</div>
	)
}

const styles = {
	page: css({
		display: "flex",
		flexDirection: "column",
		gap: "6"
	}),
	headerRow: css({
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between"
	}),
	title: css({ fontSize: "3xl", fontWeight: "bold", lineHeight: "short" }),
	subtitle: css({ color: "fg.muted" }),
	th: css({
		fontSize: "xs",
		fontWeight: "semibold",
		textTransform: "uppercase",
		letterSpacing: "widest",
		color: "fg.subtle"
	}),
	filterButton: css({ display: "inline-flex", gap: "2" }),
	dialogContent: css({
		maxW: "2xl",
		maxH: "80vh",
		overflowY: "auto"
	}),
	filterBody: css({
		display: "flex",
		flexDirection: "column",
		gap: "6",
		py: "4"
	}),
	section: css({ display: "flex", flexDirection: "column", gap: "3" }),
	sectionTitle: css({ fontSize: "base", fontWeight: "semibold" }),
	checkRow: css({
		display: "flex",
		alignItems: "center",
		gap: "2"
	}),
	checkboxLabel: css({
		fontSize: "sm",
		fontWeight: "medium",
		cursor: "pointer"
	}),
	stack2: css({ display: "flex", flexDirection: "column", gap: "2" }),
	stack3: css({ display: "flex", flexDirection: "column", gap: "3" }),
	labelSm: css({ fontSize: "sm" }),
	twoCol: css({
		display: "grid",
		gap: "2",
		gridTemplateColumns: "repeat(2, minmax(0, 1fr))"
	}),
	scrollList: css({
		display: "flex",
		flexDirection: "column",
		gap: "2",
		maxH: "60",
		overflowY: "auto"
	}),
	metaText: css({ fontSize: "sm", color: "fg.muted" }),
	mutedCentered: css({ textAlign: "center", color: "fg.muted" }),
	emptyState: css({ textAlign: "center", color: "fg.muted", py: "8" }),
	txLink: css({
		display: "inline-flex",
		alignItems: "center",
		gap: "2",
		fontWeight: "medium",
		color: "fg.default",
		_hover: { color: "colorPalette.default" }
	}),
	textLink: css({
		fontSize: "sm",
		color: "colorPalette.default",
		_hover: { color: "colorPalette.emphasized" }
	}),
	textSm: css({ fontSize: "sm" }),
	iconSm: css({ h: "4", w: "4" }),
	iconXs: css({ h: "3", w: "3" }),
	rowGap2: css({ display: "flex", alignItems: "center", gap: "2" }),
	codeXs: css({ fontSize: "xs", fontFamily: "mono" }),
	badgeXs: css({ fontSize: "xs" }),
	statusBadge: css({
		display: "inline-flex",
		alignItems: "center",
		gap: "1",
		w: "fit"
	})
}
