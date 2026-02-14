import { useState, useEffect, useRef, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link, useParams } from "react-router"
import { ArrowLeft, Shield, Coins, Award, Copy, Check, ExternalLink } from "lucide-react"
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ValidatorAvatar } from "@/components/ValidatorAvatar"
import { ValidatorSigningChart } from "@/components/analytics/ValidatorSigningChart"
import { useChain } from "@/contexts/ChainContext"
import { type DelegationEvent } from "@/lib/api"
import { validatorToCosmosAddress } from "@/lib/address"
import { formatAddress, formatTimeAgo } from "@/lib/utils"
import { css } from "@/styled-system/css"

function validatorStatusBadge(status: string | null, jailed: boolean) {
	if (jailed) return <Badge variant="destructive">Jailed</Badge>
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

function eventTypeBadge(eventType: string) {
	switch (eventType) {
		case "DELEGATE":
			return <Badge variant="success">Delegate</Badge>
		case "UNDELEGATE":
			return <Badge variant="outline">Undelegate</Badge>
		case "REDELEGATE":
			return <Badge variant="outline">Redelegate</Badge>
		case "CREATE_VALIDATOR":
			return <Badge variant="success">Create</Badge>
		case "EDIT_VALIDATOR":
			return <Badge variant="outline">Edit</Badge>
		default:
			return <Badge variant="outline">{eventType}</Badge>
	}
}

function formatCommission(rate: number | null): string {
	if (rate === null || rate === undefined) return "-"
	let normalized = rate
	if (normalized > 1e6) normalized = normalized / 1e18
	const pct = normalized > 1 ? normalized : normalized * 100
	return `${pct.toFixed(2)}%`
}

function CopyButton({ text }: { text: string }) {
	const [copied, setCopied] = useState(false)
	return (
		<button
			onClick={() => {
				navigator.clipboard.writeText(text)
				setCopied(true)
				setTimeout(() => setCopied(false), 2000)
			}}
			className={css({ cursor: "pointer", color: "fg.muted", _hover: { color: "fg.default" } })}
			title="Copy to clipboard"
		>
			{copied
				? <Check className={css({ h: "3.5", w: "3.5" })} />
				: <Copy className={css({ h: "3.5", w: "3.5" })} />
			}
		</button>
	)
}

const delegationColumnHelper = createColumnHelper<DelegationEvent>()

export default function ValidatorDetailPage() {
	const params = useParams()
	const address = params.address || ""
	const { api, chainInfo } = useChain()
	const [eventPage, setEventPage] = useState(0)
	const [eventTypeFilter, setEventTypeFilter] = useState<string | undefined>()
	const [eventPageSize, setEventPageSize] = useState(20)

	const displayDenom = chainInfo.displayDenom

	const delegationColumns: ColumnDef<DelegationEvent, any>[] = useMemo(
		() => [
			delegationColumnHelper.accessor("event_type", {
				header: "Type",
				enableSorting: false,
				cell: ({ getValue }) => eventTypeBadge(getValue()),
			}),
			delegationColumnHelper.accessor("delegator_address", {
				header: "Delegator",
				enableSorting: false,
				cell: ({ getValue }) => {
					const addr = getValue()
					return addr ? (
						<Link to={`/addr/${addr}`} className={css({ fontFamily: "mono", fontSize: "xs", _hover: { color: "accent.default" } })}>
							{formatAddress(addr, 8)}
						</Link>
					) : (
						<span className={css({ color: "fg.muted" })}>-</span>
					)
				},
			}),
			delegationColumnHelper.accessor("amount", {
				header: "Amount",
				enableSorting: false,
				cell: ({ row }) => (
					<span className={css({ fontFamily: "mono", fontSize: "sm" })}>
						{row.original.amount ? `${Number(row.original.amount).toLocaleString()} ${displayDenom}` : "-"}
					</span>
				),
			}),
			delegationColumnHelper.accessor("tx_hash", {
				header: "Tx Hash",
				enableSorting: false,
				cell: ({ getValue }) => (
					<Link to={`/tx/${getValue()}`} className={css({ fontFamily: "mono", fontSize: "xs", _hover: { color: "accent.default" } })}>
						{formatAddress(getValue(), 6)}
					</Link>
				),
			}),
			delegationColumnHelper.accessor("timestamp", {
				header: "Time",
				enableSorting: false,
				cell: ({ getValue }) => (
					<span className={css({ color: "fg.muted", fontSize: "sm" })}>
						{getValue() ? formatTimeAgo(getValue()!) : "-"}
					</span>
				),
			}),
		],
		[displayDenom],
	)

	const refreshRequested = useRef(false)

	const { data: validator, isLoading, error, refetch: refetchValidator } = useQuery({
		queryKey: ["validator-detail", chainInfo.chainId, address],
		queryFn: () => api.getValidatorDetail(address),
		enabled: !!address,
		staleTime: 15000,
	})

	useEffect(() => {
		if (!validator?.operator_address || refreshRequested.current) return
		const updatedAt = new Date(validator.updated_at).getTime()
		const ageMs = Date.now() - updatedAt
		if (ageMs > 30_000) {
			refreshRequested.current = true
			api.requestValidatorRefresh(validator.operator_address)
				.then(() => setTimeout(() => refetchValidator(), 3000))
				.catch(() => {})
		}
	}, [validator, refetchValidator, api])

	const { data: eventsData, isLoading: eventsLoading } = useQuery({
		queryKey: ["delegation-events", chainInfo.chainId, address, eventPage, eventPageSize, eventTypeFilter],
		queryFn: () => api.getDelegationEvents(address, eventPageSize, eventPage * eventPageSize, eventTypeFilter),
		enabled: !!address,
		staleTime: 15000,
	})

	const { data: performance } = useQuery({
		queryKey: ["validator-performance", chainInfo.chainId, address],
		queryFn: () => api.getValidatorPerformance(address),
		enabled: !!address,
		staleTime: 30000,
	})

	const { data: totalRewards } = useQuery({
		queryKey: ["validator-total-rewards", chainInfo.chainId, address],
		queryFn: () => api.getValidatorTotalRewards(address),
		enabled: !!address,
		staleTime: 30000,
	})

	let walletAddress: string | null = null
	try {
		walletAddress = validatorToCosmosAddress(address)
	} catch {
		// Address may not be valid bech32
	}

	if (isLoading) {
		return (
			<div className={css({ display: "flex", flexDirection: "column", gap: "6" })}>
				<Skeleton className={css({ h: "8", w: "48" })} />
				<Skeleton className={css({ h: "64", w: "full" })} />
			</div>
		)
	}

	if (error || !validator) {
		return (
			<div className={css({ textAlign: "center", py: "16" })}>
				<Shield className={css({ h: "12", w: "12", mx: "auto", mb: "4", opacity: "0.5" })} />
				<h2 className={css({ fontSize: "xl", fontWeight: "semibold", mb: "2" })}>Validator Not Found</h2>
				<p className={css({ color: "fg.muted", mb: "4" })}>No validator found at address {formatAddress(address, 12)}</p>
				<Link to="/validators">
					<Button variant="outline"><ArrowLeft className={css({ h: "4", w: "4", mr: "2" })} /> Back to Validators</Button>
				</Link>
			</div>
		)
	}

	return (
		<div className={css({ display: "flex", flexDirection: "column", gap: "6" })}>
			{/* Back nav */}
			<Link to="/validators" className={css({ display: "inline-flex", alignItems: "center", gap: "2", color: "fg.muted", _hover: { color: "fg.default" }, fontSize: "sm" })}>
				<ArrowLeft className={css({ h: "4", w: "4" })} /> Back to Validators
			</Link>

			{/* Header */}
			<div className={css({ display: "flex", alignItems: "center", gap: "4" })}>
				<ValidatorAvatar identity={validator.identity} moniker={validator.moniker} size={48} />
				<div>
					<div className={css({ display: "flex", alignItems: "center", gap: "3" })}>
						<h1 className={css({ fontSize: "2xl", fontWeight: "bold" })}>{validator.moniker || "Unknown Validator"}</h1>
						{validatorStatusBadge(validator.status, validator.jailed)}
					</div>
					{validator.website && (
						<a href={validator.website} target="_blank" rel="noopener noreferrer" className={css({ fontSize: "sm", color: "accent.default", display: "inline-flex", alignItems: "center", gap: "1" })}>
							{validator.website} <ExternalLink className={css({ h: "3", w: "3" })} />
						</a>
					)}
				</div>
			</div>

			{/* Info Grid */}
			<div className={css({ display: "grid", gridTemplateColumns: { base: "1fr", lg: "2fr 1fr" }, gap: "6" })}>
				{/* Left Column - Main Info */}
				<div className={css({ display: "flex", flexDirection: "column", gap: "6" })}>
					{/* Addresses */}
					<Card>
						<CardHeader>
							<CardTitle>Addresses</CardTitle>
						</CardHeader>
						<CardContent className={css({ display: "flex", flexDirection: "column", gap: "3" })}>
							<div className={css({ display: "flex", alignItems: "center", justifyContent: "space-between" })}>
								<div>
									<span className={css({ fontSize: "xs", color: "fg.muted", display: "block" })}>Operator</span>
									<span className={css({ fontFamily: "mono", fontSize: "sm" })}>{formatAddress(validator.operator_address, 12)}</span>
								</div>
								<CopyButton text={validator.operator_address} />
							</div>
							{walletAddress && (
								<div className={css({ display: "flex", alignItems: "center", justifyContent: "space-between" })}>
									<div>
										<span className={css({ fontSize: "xs", color: "fg.muted", display: "block" })}>Wallet</span>
										<Link to={`/addr/${walletAddress}`} className={css({ fontFamily: "mono", fontSize: "sm", color: "accent.default", _hover: { textDecoration: "underline" } })}>
											{formatAddress(walletAddress, 12)}
										</Link>
									</div>
									<CopyButton text={walletAddress} />
								</div>
							)}
							{validator.consensus_address && (
								<div className={css({ display: "flex", alignItems: "center", justifyContent: "space-between" })}>
									<div>
										<span className={css({ fontSize: "xs", color: "fg.muted", display: "block" })}>Consensus</span>
										<span className={css({ fontFamily: "mono", fontSize: "sm" })}>{formatAddress(validator.consensus_address, 12)}</span>
									</div>
									<CopyButton text={validator.consensus_address} />
								</div>
							)}
						</CardContent>
					</Card>

					{/* Commission & Details */}
					<Card>
						<CardHeader>
							<CardTitle>Commission & Details</CardTitle>
						</CardHeader>
						<CardContent>
							<div className={css({ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "4" })}>
								<div>
									<span className={css({ fontSize: "xs", color: "fg.muted", display: "block" })}>Commission Rate</span>
									<span className={css({ fontSize: "lg", fontWeight: "semibold" })}>{formatCommission(validator.commission_rate)}</span>
								</div>
								<div>
									<span className={css({ fontSize: "xs", color: "fg.muted", display: "block" })}>Max Commission</span>
									<span className={css({ fontSize: "lg", fontWeight: "semibold" })}>{formatCommission(validator.commission_max_rate)}</span>
								</div>
								<div>
									<span className={css({ fontSize: "xs", color: "fg.muted", display: "block" })}>Voting Power</span>
									<span className={css({ fontSize: "lg", fontWeight: "semibold" })}>{validator.voting_power_pct?.toFixed(2)}%</span>
								</div>
								<div>
									<span className={css({ fontSize: "xs", color: "fg.muted", display: "block" })}>Delegators</span>
									<span className={css({ fontSize: "lg", fontWeight: "semibold" })}>{validator.delegator_count}</span>
								</div>
							</div>
							{validator.details && (
								<p className={css({ mt: "4", fontSize: "sm", color: "fg.muted" })}>{validator.details}</p>
							)}
						</CardContent>
					</Card>

					{/* Signing Chart */}
					<ValidatorSigningChart consensusAddress={validator.consensus_address} />

					{/* Delegation Events */}
					<Card>
						<CardHeader>
							<CardTitle>Delegation Events</CardTitle>
						</CardHeader>
						<CardContent>
							<div className={css({ display: "flex", gap: "2", mb: "4", flexWrap: "wrap" })}>
								{["All", "DELEGATE", "UNDELEGATE", "REDELEGATE"].map((type) => (
									<Button
										key={type}
										variant={eventTypeFilter === (type === "All" ? undefined : type) ? "solid" : "outline"}
										size="sm"
										onClick={() => {
											setEventTypeFilter(type === "All" ? undefined : type)
											setEventPage(0)
										}}
									>
										{type}
									</Button>
								))}
							</div>
							<DataTable
								columns={delegationColumns}
								data={eventsData?.data ?? []}
								isLoading={eventsLoading}
								totalRows={eventsData?.pagination?.total}
								currentPage={eventPage}
								onPageChange={setEventPage}
								pageSize={eventPageSize}
								onPageSizeChange={(size) => { setEventPageSize(size); setEventPage(0) }}
								emptyState="No delegation events found"
							/>
						</CardContent>
					</Card>
				</div>

				{/* Right Column - Performance Sidebar */}
				<div className={css({ display: "flex", flexDirection: "column", gap: "6" })}>
					{/* Performance Card */}
					<Card>
						<CardHeader>
							<CardTitle className={css({ display: "flex", alignItems: "center", gap: "2" })}>
								<Award className={css({ h: "5", w: "5" })} /> Performance
							</CardTitle>
						</CardHeader>
						<CardContent className={css({ display: "flex", flexDirection: "column", gap: "4" })}>
							<div>
								<span className={css({ fontSize: "xs", color: "fg.muted", display: "block" })}>Uptime</span>
								<span className={css({ fontSize: "2xl", fontWeight: "bold", color: performance?.uptime_percentage != null && performance.uptime_percentage >= 95 ? "accent.default" : performance?.uptime_percentage != null && performance.uptime_percentage >= 80 ? "yellow.500" : "red.500" })}>
									{performance?.uptime_percentage != null ? `${performance.uptime_percentage.toFixed(1)}%` : "-"}
								</span>
							</div>
							<div className={css({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3" })}>
								<div>
									<span className={css({ fontSize: "xs", color: "fg.muted", display: "block" })}>Blocks Signed</span>
									<span className={css({ fontWeight: "semibold" })}>{performance?.blocks_signed?.toLocaleString() ?? "-"}</span>
								</div>
								<div>
									<span className={css({ fontSize: "xs", color: "fg.muted", display: "block" })}>Blocks Missed</span>
									<span className={css({ fontWeight: "semibold", color: "red.500" })}>{performance?.blocks_missed?.toLocaleString() ?? "-"}</span>
								</div>
								<div>
									<span className={css({ fontSize: "xs", color: "fg.muted", display: "block" })}>Jailing Events</span>
									<span className={css({ fontWeight: "semibold" })}>{performance?.total_jailing_events ?? "-"}</span>
								</div>
								<div>
									<span className={css({ fontSize: "xs", color: "fg.muted", display: "block" })}>Rewards Rank</span>
									<span className={css({ fontWeight: "semibold" })}>
										{performance?.rewards_rank != null ? `#${performance.rewards_rank}` : "-"}
									</span>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Lifetime Earnings */}
					<Card>
						<CardHeader>
							<CardTitle className={css({ display: "flex", alignItems: "center", gap: "2" })}>
								<Coins className={css({ h: "5", w: "5" })} /> Lifetime Earnings
							</CardTitle>
						</CardHeader>
						<CardContent className={css({ display: "flex", flexDirection: "column", gap: "3" })}>
							<div>
								<span className={css({ fontSize: "xs", color: "fg.muted", display: "block" })}>Total Rewards</span>
								<span className={css({ fontSize: "lg", fontWeight: "semibold" })}>
									{totalRewards?.total_rewards ? Number(totalRewards.total_rewards).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "-"} {displayDenom}
								</span>
							</div>
							<div>
								<span className={css({ fontSize: "xs", color: "fg.muted", display: "block" })}>Total Commission</span>
								<span className={css({ fontSize: "lg", fontWeight: "semibold" })}>
									{totalRewards?.total_commission ? Number(totalRewards.total_commission).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "-"} {displayDenom}
								</span>
							</div>
							<div>
								<span className={css({ fontSize: "xs", color: "fg.muted", display: "block" })}>Blocks With Rewards</span>
								<span className={css({ fontWeight: "semibold" })}>{totalRewards?.blocks_with_rewards?.toLocaleString() ?? "-"}</span>
							</div>
						</CardContent>
					</Card>

					{/* Staking Actions (disabled placeholder) */}
					<Card>
						<CardHeader>
							<CardTitle className={css({ display: "flex", alignItems: "center", gap: "2" })}>
								<Shield className={css({ h: "5", w: "5" })} /> Staking
							</CardTitle>
						</CardHeader>
						<CardContent className={css({ display: "flex", flexDirection: "column", gap: "2" })}>
							<Button variant="outline" disabled title="Wallet connection coming soon">
								Delegate
							</Button>
							<Button variant="outline" disabled title="Wallet connection coming soon">
								Undelegate
							</Button>
							<p className={css({ fontSize: "xs", color: "fg.muted", textAlign: "center", mt: "1" })}>
								Wallet connection coming soon
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}
