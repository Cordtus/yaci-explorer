import { useQuery } from "@tanstack/react-query"
import { AlertTriangle } from "lucide-react"
import { Link } from "react-router"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useChain } from "@/contexts/ChainContext"
import { css } from "@/styled-system/css"

function eventBadgeVariant(eventType: string): "destructive" | "outline" | "success" {
	if (eventType.includes("jail") || eventType.includes("slash")) return "destructive"
	if (eventType.includes("unjail") || eventType.includes("create")) return "success"
	return "outline"
}

function formatEventType(eventType: string): string {
	return eventType
		.replace(/_/g, " ")
		.replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatTimeAgo(time: string | null): string {
	if (!time) return ""
	const diff = Date.now() - new Date(time).getTime()
	const mins = Math.floor(diff / 60_000)
	if (mins < 60) return `${mins}m ago`
	const hours = Math.floor(mins / 60)
	if (hours < 24) return `${hours}h ago`
	const days = Math.floor(hours / 24)
	return `${days}d ago`
}

export function ValidatorEventsCard() {
	const { api, chainInfo } = useChain()

	const { data, isLoading } = useQuery({
		queryKey: ["validator-events-summary", chainInfo.chainId],
		queryFn: () => api.getValidatorEventsSummary(15),
		staleTime: 15_000,
		refetchInterval: 30_000,
	})

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className={titleStyle}><AlertTriangle className={iconStyle} />Recent Validator Events</CardTitle>
				</CardHeader>
				<CardContent>
					<div className={css({ display: "flex", flexDir: "column", gap: "3" })}>
						{Array.from({ length: 5 }).map((_, i) => (
							<Skeleton key={i} className={css({ h: "10", w: "full" })} />
						))}
					</div>
				</CardContent>
			</Card>
		)
	}

	if (!data || data.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className={titleStyle}><AlertTriangle className={iconStyle} />Recent Validator Events</CardTitle>
				</CardHeader>
				<CardContent>
					<div className={css({ py: "8", textAlign: "center", color: "fg.muted" })}>
						No recent validator events
					</div>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className={titleStyle}><AlertTriangle className={iconStyle} />Recent Validator Events</CardTitle>
				<CardDescription>Slashing, jailing, and delegation events across the network</CardDescription>
			</CardHeader>
			<CardContent>
				<div className={css({ display: "flex", flexDir: "column", gap: "2" })}>
					{data.map((event, i) => (
						<div key={`${event.height}-${i}`} className={rowStyle}>
							<div className={css({ display: "flex", alignItems: "center", gap: "2", flex: "1", minW: "0" })}>
								<Badge variant={eventBadgeVariant(event.event_type)}>
									{formatEventType(event.event_type)}
								</Badge>
								{event.operator_address ? (
									<Link
										to={`/validators/${event.operator_address}`}
										className={css({ fontSize: "sm", color: "accent.default", _hover: { textDecoration: "underline" }, truncate: true })}
									>
										{event.validator_moniker || event.operator_address}
									</Link>
								) : (
									<span className={css({ fontSize: "sm", color: "fg.muted", truncate: true })}>
										{event.validator_moniker || "Unknown"}
									</span>
								)}
							</div>
							<div className={css({ display: "flex", alignItems: "center", gap: "3", flexShrink: "0" })}>
								<Link
									to={`/blocks/${event.height}`}
									className={css({ fontFamily: "mono", fontSize: "xs", color: "fg.muted", _hover: { color: "accent.default" } })}
								>
									#{event.height.toLocaleString()}
								</Link>
								<span className={css({ fontSize: "xs", color: "fg.muted", minW: "50px", textAlign: "right" })}>
									{formatTimeAgo(event.block_time)}
								</span>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	)
}

const titleStyle = css({ display: "flex", alignItems: "center", gap: "2" })
const iconStyle = css({ h: "5", w: "5" })
const rowStyle = css({
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	gap: "3",
	py: "2",
	borderBottomWidth: "1px",
	borderColor: "border.default",
	_last: { borderBottomWidth: "0" },
})
