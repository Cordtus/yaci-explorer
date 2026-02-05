import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router"
import { Shield, AlertTriangle, CheckCircle } from "lucide-react"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { api, type Validator, } from "@/lib/api"
import { formatAddress, formatTimeAgo } from "@/lib/utils"
import { formatDenomAmount } from "@/lib/denom"
import { getChainInfo } from "@/lib/chain-info"
import { css } from "@/styled-system/css"

type SortField = "tokens" | "moniker" | "commission" | "status" | "delegators" | "uptime"
type SortDir = "asc" | "desc"

/** Extended validator with signing stats */
interface ValidatorWithUptime extends Validator {
	signing_percentage: number | null
	blocks_missed: number | null
}

/** Checks if validator is active (bonded and not jailed) */
function isActiveValidator(v: Validator): boolean {
	return v.status === "BOND_STATUS_BONDED" && !v.jailed
}

/**
 * Sorts validators with active first, then by secondary field.
 * Primary: active validators before inactive
 * Secondary: user-selected field and direction
 */
function sortValidators(
	validators: ValidatorWithUptime[] | undefined,
	sortBy: SortField,
	sortDir: SortDir
): ValidatorWithUptime[] {
	if (!validators) return []
	return [...validators].sort((a, b) => {
		// Primary sort: active validators first
		const aActive = isActiveValidator(a)
		const bActive = isActiveValidator(b)
		if (aActive !== bActive) {
			return aActive ? -1 : 1
		}

		// Secondary sort by selected field
		let cmp = 0
		switch (sortBy) {
			case "moniker":
				cmp = (a.moniker || "").localeCompare(b.moniker || "")
				break
			case "tokens":
				cmp = (a.voting_power_pct || 0) - (b.voting_power_pct || 0)
				break
			case "commission":
				cmp = (a.commission_rate || 0) - (b.commission_rate || 0)
				break
			case "status":
				cmp = (a.status || "").localeCompare(b.status || "")
				break
			case "delegators":
				cmp = (a.delegator_count || 0) - (b.delegator_count || 0)
				break
			case "uptime":
				cmp = (a.signing_percentage ?? 100) - (b.signing_percentage ?? 100)
				break
		}
		return sortDir === "desc" ? -cmp : cmp
	})
}

/**
 * Returns a badge for validator bond status
 */
function validatorStatusBadge(status: string | null, jailed: boolean) {
	if (jailed) {
		return <Badge variant="destructive">Jailed</Badge>
	}
	switch (status) {
		case "BOND_STATUS_BONDED":
			return <Badge variant="success">Active</Badge>
		case "BOND_STATUS_UNBONDING":
			return <Badge variant="outline">Unbonding</Badge>
		case "BOND_STATUS_UNBONDED":
			return <Badge variant="outline">Inactive</Badge>
		default:
			return <Badge variant="outline">Unknown</Badge>
	}
}

/**
 * Formats a commission rate (stored as 0-1 decimal) as percentage.
 * Defensively handles leftover Cosmos SDK Dec format (10^18) values.
 */
function formatCommission(rate: number | null): string {
	if (rate === null || rate === undefined) return "-"
	let normalized = rate
	if (normalized > 1e6) normalized = normalized / 1e18
	const pct = normalized > 1 ? normalized : normalized * 100
	return `${pct.toFixed(2)}%`
}

/**
 * Returns color style for uptime percentage:
 * green (>=95%), yellow (>=80%), red (<80%)
 */
function getUptimeColor(pct: number | null): string {
	if (pct === null) return "fg.muted"
	if (pct >= 95) return "republicGreen.default"
	if (pct >= 80) return "yellow.500"
	return "red.500"
}

function ValidatorEvents() {
	const { data: events, isLoading, error } = useQuery({
		queryKey: ["validator-events"],
		queryFn: () => api.getRecentValidatorEvents(["slash", "liveness", "jail"], 100, 0),
		staleTime: 30000,
		retry: 1,
	})

	if (isLoading) {
		return (
			<div className={css(styles.loadingContainer)}>
				{Array.from({ length: 5 }).map((_, i) => (
					<Skeleton key={i} className={css(styles.skeleton)} />
				))}
			</div>
		)
	}

	if (error) {
		return (
			<Card>
				<CardContent className={css(styles.eventsErrorCard)}>
					<AlertTriangle className={css(styles.eventsErrorIcon)} />
					<div className={css(styles.eventsErrorText)}>
						<div className={css(styles.eventsErrorTitle)}>
							Validator Events Not Available
						</div>
						<div className={css(styles.eventsErrorDesc)}>
							Block results extraction may not be enabled. Run yaci with
							--enable-block-results flag.
						</div>
					</div>
				</CardContent>
			</Card>
		)
	}

	if (!events || events.length === 0) {
		return (
			<Card>
				<CardContent className={css(styles.eventsEmptyCard)}>
					<CheckCircle className={css(styles.eventsEmptyIcon)} />
					<div className={css(styles.eventsEmptyText)}>
						<div className={css(styles.eventsEmptyTitle)}>No Recent Events</div>
						<div className={css(styles.eventsEmptyDesc)}>
							No slashing or liveness events have occurred recently.
						</div>
					</div>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Recent Liveness Events</CardTitle>
				<CardDescription>
					Slashing, jailing, and liveness fault events from finalize_block_events
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className={css(styles.eventsList)}>
					{events.map((event, index) => (
						<div
							key={`${event.height}-${index}`}
							className={css(styles.eventItem)}
							style={{
								borderLeftColor: event.event_type === "slash" ? "var(--colors-red-500)" : "var(--colors-orange-500)",
							}}
						>
							<div className={css(styles.eventInfo)}>
								<div className={css(styles.eventHeader)}>
									<Badge variant={event.event_type === "slash" ? "destructive" : "outline"}>
										{event.event_type.toUpperCase()}
									</Badge>
									{event.operator_address ? (
										<Link
											to={`/validators/${event.operator_address}`}
											className={css(styles.eventMoniker)}
										>
											{event.moniker || "Unknown Validator"}
										</Link>
									) : (
										<span className={css(styles.eventMoniker)}>
											{event.moniker || "Unknown Validator"}
										</span>
									)}
								</div>
								<div className={css(styles.eventDetails)}>
									<div className={css(styles.eventReason)}>
										{formatEventReason(event.event_type, event.reason)}
									</div>
									<div className={css(styles.eventAddresses)}>
										<span className={css(styles.eventAddressLabel)}>Consensus:</span>
										<code className={css(styles.eventAddressValue)}>
											{formatAddress(event.validator_address, 12)}
										</code>
										{event.power && (
											<>
												<span className={css(styles.eventAddressLabel)}>Power:</span>
												<span className={css(styles.eventAddressValue)}>{event.power}</span>
											</>
										)}
									</div>
								</div>
							</div>
							<div className={css(styles.eventMeta)}>
								<Link
									to={`/blocks/${event.height}`}
									className={css(styles.eventBlockLink)}
								>
									Block #{event.height}
								</Link>
								<div className={css(styles.eventTime)}>
									{event.created_at ? formatTimeAgo(event.created_at) : "-"}
								</div>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	)
}

/**
 * Format event reason for better readability
 */
function formatEventReason(eventType: string, reason: string | null): string {
	if (!reason) return "Event occurred"
	// Clean up common reason formats
	if (reason.includes("missing_signature")) {
		return "Missed block signature (liveness fault)"
	}
	if (reason.includes("double_sign")) {
		return "Double signing detected"
	}
	if (eventType === "jail") {
		return `Jailed: ${reason}`
	}
	if (eventType === "liveness") {
		return `Liveness fault: ${reason}`
	}
	return reason
}

export default function ValidatorsPage() {
	const [page, setPage] = useState(0)
	// Default sort: moniker descending (Z-A) - secondary to the fixed active-first grouping
	const [sortBy, setSortBy] = useState<SortField>("moniker")
	const [sortDir, setSortDir] = useState<SortDir>("desc")
	const [search, setSearch] = useState("")
	const limit = 20

	const { data: stats, isLoading: statsLoading } = useQuery({
		queryKey: ["validator-stats"],
		queryFn: () => api.getValidatorStats(),
		staleTime: 30000,
	})

	const { data: chainInfo } = useQuery({
		queryKey: ["chain-info"],
		queryFn: () => getChainInfo(api),
		staleTime: Infinity,
	})

	// Fetch all validators for client-side sorting (active-first grouping)
	const { data: validatorsData, isLoading: validatorsLoading } = useQuery({
		queryKey: ["validators-all", search],
		queryFn: () =>
			api.getValidatorsPaginated(500, 0, {
				sortBy: "moniker",
				sortDir: "asc",
				search: search || undefined,
			}),
		staleTime: 15000,
	})

	// Fetch signing stats for all validators (indexed block signatures)
	const { data: signingStats } = useQuery({
		queryKey: ["validators-signing-stats"],
		queryFn: () => api.getAllValidatorsSigningStats(10000),
		staleTime: 30000,
	})

	// Create a map of consensus_address -> signing stats for quick lookup
	const signingStatsMap = useMemo(() => {
		const map = new Map<string, { signing_percentage: number; blocks_missed: number }>()
		if (signingStats) {
			for (const stat of signingStats) {
				map.set(stat.consensus_address, {
					signing_percentage: stat.signing_percentage,
					blocks_missed: stat.blocks_missed,
				})
			}
		}
		return map
	}, [signingStats])

	// Merge validators with signing stats
	const validatorsWithUptime = useMemo((): ValidatorWithUptime[] => {
		if (!validatorsData?.data) return []
		return validatorsData.data.map((v) => {
			const stats = v.consensus_address ? signingStatsMap.get(v.consensus_address.toUpperCase()) : null
			return {
				...v,
				signing_percentage: stats?.signing_percentage ?? null,
				blocks_missed: stats?.blocks_missed ?? null,
			}
		})
	}, [validatorsData, signingStatsMap])

	// Sort validators: active first, then by user-selected secondary sort
	const sortedValidators = useMemo(() => {
		return sortValidators(validatorsWithUptime, sortBy, sortDir)
	}, [validatorsWithUptime, sortBy, sortDir])

	// Paginate the sorted results
	const paginatedValidators = useMemo(() => {
		const start = page * limit
		return sortedValidators.slice(start, start + limit)
	}, [sortedValidators, page])

	const totalPages = Math.ceil(sortedValidators.length / limit)

	/** Toggles sort direction or sets a new sort field */
	function handleSort(field: SortField) {
		if (sortBy === field) {
			setSortDir((d) => (d === "desc" ? "asc" : "desc"))
		} else {
			setSortBy(field)
			setSortDir("desc")
		}
		setPage(0)
	}

	/** Renders a sort indicator arrow */
	function sortIndicator(field: SortField) {
		if (sortBy !== field) return null
		return sortDir === "desc" ? " \u2193" : " \u2191"
	}

	return (
		<div className={css(styles.container)}>
			{/* Header */}
			<div className={css(styles.header)}>
				<div>
					<h1 className={css(styles.title)}>Validators</h1>
					<p className={css(styles.subtitle)}>
						Network validator set and delegation activity
					</p>
				</div>
			</div>

			{/* Stats */}
			<div className={css(styles.statsGrid)}>
				{statsLoading ? (
					Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className={css(styles.statSkeleton)} />
					))
				) : stats ? (
					<>
						<Card>
							<CardContent className={css(styles.statCard)}>
								<span className={css(styles.statLabel)}>Total Validators</span>
								<span className={css(styles.statValue)}>
									{stats.total_validators}
								</span>
							</CardContent>
						</Card>
						<Card>
							<CardContent className={css(styles.statCard)}>
								<span className={css(styles.statLabel)}>Active</span>
								<span className={css(styles.statValueSuccess)}>
									{stats.active_validators}
								</span>
							</CardContent>
						</Card>
						<Card>
							<CardContent className={css(styles.statCard)}>
								<span className={css(styles.statLabel)}>Jailed</span>
								<span className={css(styles.statValueDanger)}>
									{stats.jailed_validators}
								</span>
							</CardContent>
						</Card>
						<Card>
							<CardContent className={css(styles.statCard)}>
								<span className={css(styles.statLabel)}>Total Bonded</span>
								<span className={css(styles.statValue)}>
									{formatDenomAmount(stats.total_bonded_tokens, chainInfo?.baseDenom || 'arai', { maxDecimals: 0 })} {chainInfo?.displayDenom || 'RAI'}
								</span>
							</CardContent>
						</Card>
					</>
				) : null}
			</div>

			<Tabs defaultValue="validators" className={css(styles.tabs)}>
				<TabsList>
					<TabsTrigger value="validators">Validator Set</TabsTrigger>
					<TabsTrigger value="events">Liveness Events</TabsTrigger>
				</TabsList>

				<TabsContent value="validators" className={css(styles.tabContent)}>
					{/* Search Filter */}
					<div className={css(styles.filterRow)}>
						<input
							type="text"
							placeholder="Search by moniker or address..."
							value={search}
							onChange={(e) => {
								setSearch(e.target.value)
								setPage(0)
							}}
							className={css(styles.searchInput)}
						/>
					</div>

					{/* Validators Table */}
					<Card>
				<CardHeader>
					<CardTitle>Validator Set</CardTitle>
					<CardDescription>
						{sortedValidators.length > 0
							? `${sortedValidators.length} validators (active first, then by ${sortBy})`
							: "Loading..."}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{validatorsLoading ? (
						<div className={css(styles.loadingContainer)}>
							{Array.from({ length: 5 }).map((_, i) => (
								<Skeleton key={i} className={css(styles.skeleton)} />
							))}
						</div>
					) : !paginatedValidators.length ? (
						<div className={css(styles.emptyState)}>
							<Shield className={css(styles.emptyIcon)} />
							<h3 className={css(styles.emptyTitle)}>No Validators</h3>
							<p className={css(styles.emptyText)}>
								No validators found matching your criteria.
							</p>
						</div>
					) : (
						<>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className={css(styles.rankCol)}>#</TableHead>
										<TableHead
											className={css(styles.sortableHead)}
											onClick={() => handleSort("moniker")}
										>
											Moniker{sortIndicator("moniker")}
										</TableHead>
										<TableHead>Operator Address</TableHead>
										<TableHead
											className={css(styles.sortableHead)}
											onClick={() => handleSort("tokens")}
										>
											Voting Power{sortIndicator("tokens")}
										</TableHead>
										<TableHead
											className={css(styles.sortableHead)}
											onClick={() => handleSort("commission")}
										>
											Commission{sortIndicator("commission")}
										</TableHead>
										<TableHead
											className={css(styles.sortableHead)}
											onClick={() => handleSort("status")}
										>
											Status{sortIndicator("status")}
										</TableHead>
										<TableHead>IPFS</TableHead>
										<TableHead
											className={css(styles.sortableHead)}
											onClick={() => handleSort("uptime")}
										>
											Uptime{sortIndicator("uptime")}
										</TableHead>
										<TableHead
											className={css(styles.sortableHead)}
											onClick={() => handleSort("delegators")}
										>
											Delegators{sortIndicator("delegators")}
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{paginatedValidators.map((v, idx) => (
										<TableRow key={v.operator_address}>
											<TableCell className={css(styles.rankCell)}>
												{page * limit + idx + 1}
											</TableCell>
											<TableCell>
												<Link
													to={`/validators/${v.operator_address}`}
													className={css(styles.monikerLink)}
												>
													{v.moniker || "Unknown"}
												</Link>
											</TableCell>
											<TableCell>
												<Link
													to={`/validators/${v.operator_address}`}
													className={css(styles.addressLink)}
												>
													{formatAddress(v.operator_address, 8)}
												</Link>
											</TableCell>
											<TableCell className={css(styles.monoText)}>
												{v.voting_power_pct?.toFixed(2)}%
											</TableCell>
											<TableCell className={css(styles.monoText)}>
												{formatCommission(v.commission_rate)}
											</TableCell>
											<TableCell>
												{validatorStatusBadge(v.status, v.jailed)}
											</TableCell>
										<TableCell
											className={css({
												fontFamily: "mono",
												fontSize: "sm",
												color: getUptimeColor(v.signing_percentage),
											})}
										>
											{v.signing_percentage !== null
												? `${v.signing_percentage.toFixed(1)}%`
												: "-"}
										</TableCell>
											<TableCell className={css(styles.monoSmall)}>
												{v.ipfs_peer_id
													? `${v.ipfs_peer_id.slice(0, 16)}...`
													: "-"}
											</TableCell>
											<TableCell className={css(styles.monoText)}>
												{v.delegator_count}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>

							{totalPages > 1 && (
								<div className={css(styles.pagination)}>
									<Button
										variant="outline"
										size="sm"
										disabled={page === 0}
										onClick={() => setPage((p) => p - 1)}
									>
										Previous
									</Button>
									<span className={css(styles.pageInfo)}>
										Page {page + 1} of {totalPages}
									</span>
									<Button
										variant="outline"
										size="sm"
										disabled={page >= totalPages - 1}
										onClick={() => setPage((p) => p + 1)}
									>
										Next
									</Button>
								</div>
							)}
						</>
					)}
				</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="events" className={css(styles.tabContent)}>
					<ValidatorEvents />
				</TabsContent>
			</Tabs>
		</div>
	)
}

const styles = {
	container: {
		display: "flex",
		flexDirection: "column",
		gap: "6",
		w: "full",
	},
	header: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		w: "full",
	},
	title: {
		fontSize: "3xl",
		fontWeight: "bold",
	},
	subtitle: {
		color: "fg.muted",
		marginTop: "1",
	},
	statsGrid: {
		display: "grid",
		gridTemplateColumns: {
			base: "repeat(2, 1fr)",
			md: "repeat(4, 1fr)",
		},
		gap: "4",
	},
	statSkeleton: {
		height: "20",
		width: "full",
	},
	statCard: {
		display: "flex",
		flexDirection: "column",
		gap: "1",
		py: "4",
	},
	statLabel: {
		fontSize: "xs",
		fontWeight: "medium",
		color: "fg.muted",
		textTransform: "uppercase",
		letterSpacing: "wider",
	},
	statValue: {
		fontSize: "2xl",
		fontWeight: "bold",
	},
	statValueSuccess: {
		fontSize: "2xl",
		fontWeight: "bold",
		color: "republicGreen.default",
	},
	statValueDanger: {
		fontSize: "2xl",
		fontWeight: "bold",
		color: "red.500",
	},
	filterRow: {
		display: "flex",
		alignItems: "center",
		gap: "4",
		flexWrap: "wrap",
	},
	searchInput: {
		fontSize: "sm",
		bg: "bg.muted",
		border: "1px solid",
		borderColor: "border.default",
		rounded: "md",
		px: "3",
		py: "1.5",
		color: "fg.default",
		flex: "1",
		minWidth: "200px",
		maxWidth: "400px",
		outline: "none",
		_focus: { borderColor: "accent.default" },
		_placeholder: { color: "fg.muted" },
	},
	loadingContainer: {
		display: "flex",
		flexDirection: "column",
		gap: "3",
	},
	skeleton: {
		height: "12",
		width: "full",
	},
	emptyState: {
		textAlign: "center",
		py: "12",
		color: "fg.muted",
	},
	emptyIcon: {
		height: "12",
		width: "12",
		margin: "0 auto",
		marginBottom: "4",
		opacity: "0.5",
	},
	emptyTitle: {
		fontSize: "lg",
		fontWeight: "semibold",
		color: "fg.default",
		marginBottom: "2",
	},
	emptyText: {
		maxWidth: "md",
		margin: "0 auto",
	},
	rankCol: {
		width: "60px",
	},
	rankCell: {
		fontFamily: "mono",
		fontSize: "sm",
		color: "fg.muted",
	},
	sortableHead: {
		cursor: "pointer",
		userSelect: "none",
		_hover: { color: "accent.default" },
	},
	monikerLink: {
		fontWeight: "semibold",
		color: "accent.default",
		_hover: { textDecoration: "underline" },
	},
	addressLink: {
		fontFamily: "mono",
		fontSize: "xs",
		_hover: { color: "accent.default" },
	},
	monoText: {
		fontFamily: "mono",
		fontSize: "sm",
	},
	pagination: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		gap: "4",
		marginTop: "4",
	},
	pageInfo: {
		fontSize: "sm",
		color: "fg.muted",
	},
	monoSmall: {
		fontFamily: "mono",
		fontSize: "xs",
	},
	tabs: {
		width: "full",
	},
	tabContent: {
		display: "flex",
		flexDirection: "column",
		gap: "4",
		marginTop: "4",
	},
	eventsList: {
		display: "flex",
		flexDirection: "column",
		gap: "3",
	},
	eventItem: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		padding: "4",
		borderRadius: "md",
		bg: "bg.muted",
		borderLeft: "4px solid",
	},
	eventInfo: {
		display: "flex",
		flexDirection: "column",
		gap: "1",
	},
	eventHeader: {
		display: "flex",
		alignItems: "center",
		gap: "2",
	},
	eventMoniker: {
		fontWeight: "medium",
		color: "accent.default",
		_hover: { textDecoration: "underline" },
	},
	eventReason: {
		fontSize: "sm",
		color: "fg.muted",
	},
	eventDetails: {
		display: "flex",
		flexDirection: "column",
		gap: "1",
		marginTop: "1",
	},
	eventAddresses: {
		display: "flex",
		alignItems: "center",
		gap: "2",
		fontSize: "xs",
		flexWrap: "wrap",
	},
	eventAddressLabel: {
		color: "fg.muted",
	},
	eventAddressValue: {
		fontFamily: "mono",
		color: "fg.subtle",
	},
	eventMeta: {
		textAlign: "right",
	},
	eventBlockLink: {
		fontSize: "sm",
		color: "accent.default",
		_hover: { textDecoration: "underline" },
	},
	eventTime: {
		fontSize: "xs",
		color: "fg.muted",
	},
	eventsErrorCard: {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		gap: "3",
		py: "8",
	},
	eventsErrorIcon: {
		height: "12",
		width: "12",
		color: "fg.muted",
	},
	eventsErrorText: {
		textAlign: "center",
	},
	eventsErrorTitle: {
		fontWeight: "medium",
		marginBottom: "1",
	},
	eventsErrorDesc: {
		fontSize: "sm",
		color: "fg.muted",
	},
	eventsEmptyCard: {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		gap: "3",
		py: "8",
	},
	eventsEmptyIcon: {
		height: "12",
		width: "12",
		color: "republicGreen.default",
	},
	eventsEmptyText: {
		textAlign: "center",
	},
	eventsEmptyTitle: {
		fontWeight: "medium",
		marginBottom: "1",
	},
	eventsEmptyDesc: {
		fontSize: "sm",
		color: "fg.muted",
	},
}
