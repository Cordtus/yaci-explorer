import { useQuery } from "@tanstack/react-query"
import { Link2 } from "lucide-react"
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { useChain } from "@/contexts/ChainContext"
import { css } from "@/styled-system/css"

interface IbcChannel {
	channel_id: string
	port_id: string
	counterparty_channel_id: string | null
	counterparty_port_id: string | null
	connection_id: string | null
	state: string | null
	ordering: string | null
	version: string | null
	updated_at: string
}

function channelStateBadge(state: string | null) {
	switch (state) {
		case "STATE_OPEN":
			return <Badge variant="success">Open</Badge>
		case "STATE_CLOSED":
			return <Badge variant="destructive">Closed</Badge>
		case "STATE_INIT":
			return <Badge variant="outline">Init</Badge>
		case "STATE_TRYOPEN":
			return <Badge variant="outline">TryOpen</Badge>
		default:
			return <Badge variant="outline">{state || "Unknown"}</Badge>
	}
}

const columnHelper = createColumnHelper<IbcChannel>()

const columns: ColumnDef<IbcChannel, any>[] = [
	columnHelper.accessor("channel_id", {
		header: "Channel",
		cell: ({ getValue }) => (
			<span className={css({ fontFamily: "mono", fontSize: "sm", fontWeight: "semibold" })}>
				{getValue()}
			</span>
		),
	}),
	columnHelper.accessor("port_id", {
		header: "Port",
		cell: ({ getValue }) => (
			<span className={css({ fontFamily: "mono", fontSize: "sm" })}>
				{getValue()}
			</span>
		),
	}),
	columnHelper.accessor("counterparty_channel_id", {
		header: "Counterparty Channel",
		cell: ({ getValue }) => (
			<span className={css({ fontFamily: "mono", fontSize: "sm", color: "fg.muted" })}>
				{getValue() || "-"}
			</span>
		),
	}),
	columnHelper.accessor("counterparty_port_id", {
		header: "Counterparty Port",
		cell: ({ getValue }) => (
			<span className={css({ fontFamily: "mono", fontSize: "sm", color: "fg.muted" })}>
				{getValue() || "-"}
			</span>
		),
	}),
	columnHelper.accessor("connection_id", {
		header: "Connection",
		cell: ({ getValue }) => (
			<span className={css({ fontFamily: "mono", fontSize: "xs" })}>
				{getValue() || "-"}
			</span>
		),
	}),
	columnHelper.accessor("state", {
		header: "State",
		cell: ({ getValue }) => channelStateBadge(getValue()),
	}),
	columnHelper.accessor("ordering", {
		header: "Ordering",
		cell: ({ getValue }) => (
			<span className={css({ fontSize: "sm" })}>
				{getValue()?.replace("ORDER_", "") || "-"}
			</span>
		),
	}),
]

export function IbcPage() {
	const { api, chainInfo } = useChain()

	const { data: channels, isLoading } = useQuery({
		queryKey: ["ibc-channels", chainInfo.chainId],
		queryFn: () => api.getIbcChannels(200),
		staleTime: 30_000,
	})

	const openCount = channels?.filter((c) => c.state === "STATE_OPEN").length ?? 0

	return (
		<div className={css({ display: "flex", flexDir: "column", gap: "6", w: "full" })}>
			<div>
				<h1 className={css({ fontSize: "3xl", fontWeight: "bold" })}>IBC Channels</h1>
				<p className={css({ color: "fg.muted", mt: "1" })}>
					Inter-Blockchain Communication channels on {chainInfo.chainId}
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Channel Registry</CardTitle>
					<CardDescription>
						{channels
							? `${channels.length} channels (${openCount} open)`
							: "Loading..."}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<DataTable
						columns={columns}
						data={channels ?? []}
						isLoading={isLoading}
						pageSize={50}
						getRowId={(c) => `${c.channel_id}-${c.port_id}`}
						emptyState={
							<div className={css({ textAlign: "center", py: "12", color: "fg.muted" })}>
								<Link2 className={css({ h: "12", w: "12", mx: "auto", mb: "4", opacity: "0.5" })} />
								<h3 className={css({ fontSize: "lg", fontWeight: "semibold", color: "fg.default", mb: "2" })}>No IBC Channels</h3>
								<p className={css({ maxW: "md", mx: "auto" })}>No IBC channels have been established yet.</p>
							</div>
						}
					/>
				</CardContent>
			</Card>
		</div>
	)
}

export default IbcPage
