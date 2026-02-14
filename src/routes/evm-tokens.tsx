import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router"
import { Coins } from "lucide-react"
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
import { type EvmToken } from "@/lib/api"
import { truncateAddress } from "@/lib/address"
import { css } from "@/styled-system/css"

const columnHelper = createColumnHelper<EvmToken>()

const columns: ColumnDef<EvmToken, any>[] = [
	columnHelper.accessor("name", {
		header: "Name",
		cell: ({ getValue }) => (
			<span className={css({ fontWeight: "semibold" })}>
				{getValue() || "Unknown"}
			</span>
		),
	}),
	columnHelper.accessor("symbol", {
		header: "Symbol",
		cell: ({ getValue }) => (
			<span className={css({ fontFamily: "mono", fontSize: "sm" })}>
				{getValue() || "-"}
			</span>
		),
	}),
	columnHelper.accessor("type", {
		header: "Type",
		cell: ({ getValue }) => {
			const t = getValue()
			if (!t) return <Badge variant="outline">Unknown</Badge>
			return <Badge variant="outline">{t}</Badge>
		},
	}),
	columnHelper.accessor("decimals", {
		header: "Decimals",
		cell: ({ getValue }) => (
			<span className={css({ fontFamily: "mono", fontSize: "sm" })}>
				{getValue() ?? "-"}
			</span>
		),
	}),
	columnHelper.accessor("total_supply", {
		header: "Total Supply",
		cell: ({ getValue }) => {
			const supply = getValue()
			if (!supply) return "-"
			const num = parseFloat(supply)
			if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`
			if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`
			if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
			if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`
			return num.toLocaleString()
		},
	}),
	columnHelper.accessor("address", {
		header: "Contract",
		enableSorting: false,
		cell: ({ getValue }) => (
			<Link
				to={`/addr/${getValue()}`}
				className={css({ fontFamily: "mono", fontSize: "xs", color: "accent.default", _hover: { textDecoration: "underline" } })}
			>
				{truncateAddress(getValue(), 8)}
			</Link>
		),
	}),
]

export function EvmTokensPage() {
	const { api, chainInfo } = useChain()
	const [page, setPage] = useState(0)
	const pageSize = 50

	const { data: tokens, isLoading } = useQuery({
		queryKey: ["evm-tokens", chainInfo.chainId, page, pageSize],
		queryFn: () => api.getEvmTokens(pageSize, page * pageSize),
		staleTime: 15_000,
	})

	return (
		<div className={css({ display: "flex", flexDir: "column", gap: "6", w: "full" })}>
			<div>
				<h1 className={css({ fontSize: "3xl", fontWeight: "bold" })}>EVM Tokens</h1>
				<p className={css({ color: "fg.muted", mt: "1" })}>
					Tracked tokens on {chainInfo.chainId}
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Token Registry</CardTitle>
					<CardDescription>
						{tokens ? `${tokens.length} tokens loaded` : "Loading..."}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<DataTable
						columns={columns}
						data={tokens ?? []}
						isLoading={isLoading}
						pageSize={pageSize}
						getRowId={(t) => t.address}
						emptyState={
							<div className={css({ textAlign: "center", py: "12", color: "fg.muted" })}>
								<Coins className={css({ h: "12", w: "12", mx: "auto", mb: "4", opacity: "0.5" })} />
								<h3 className={css({ fontSize: "lg", fontWeight: "semibold", color: "fg.default", mb: "2" })}>No Tokens</h3>
								<p className={css({ maxW: "md", mx: "auto" })}>No EVM tokens have been detected yet.</p>
							</div>
						}
					/>
				</CardContent>
			</Card>
		</div>
	)
}

export default EvmTokensPage
