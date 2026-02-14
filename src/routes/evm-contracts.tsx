import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router"
import { Code } from "lucide-react"
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
import { type EvmContract } from "@/lib/api"
import { truncateAddress } from "@/lib/address"
import { css } from "@/styled-system/css"

const columnHelper = createColumnHelper<EvmContract>()

const columns: ColumnDef<EvmContract, any>[] = [
	columnHelper.accessor("address", {
		header: "Address",
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
	columnHelper.accessor("name", {
		header: "Name",
		cell: ({ getValue }) => (
			<span className={css({ fontWeight: "medium" })}>
				{getValue() || "-"}
			</span>
		),
	}),
	columnHelper.accessor("creator", {
		header: "Creator",
		enableSorting: false,
		cell: ({ getValue }) => {
			const addr = getValue()
			if (!addr) return <span className={css({ color: "fg.muted" })}>-</span>
			return (
				<Link
					to={`/addr/${addr}`}
					className={css({ fontFamily: "mono", fontSize: "xs", color: "fg.muted", _hover: { color: "accent.default" } })}
				>
					{truncateAddress(addr, 6)}
				</Link>
			)
		},
	}),
	columnHelper.accessor("creation_height", {
		header: "Deploy Block",
		cell: ({ getValue }) => (
			<Link
				to={`/blocks/${getValue()}`}
				className={css({ fontFamily: "mono", fontSize: "sm", _hover: { color: "accent.default" } })}
			>
				{getValue().toLocaleString()}
			</Link>
		),
	}),
	columnHelper.accessor("is_verified", {
		header: "Verified",
		cell: ({ getValue }) => (
			getValue()
				? <Badge variant="success">Verified</Badge>
				: <Badge variant="outline">Unverified</Badge>
		),
	}),
]

export function EvmContractsPage() {
	const { api, chainInfo } = useChain()
	const [page, setPage] = useState(0)
	const pageSize = 50

	const { data: contracts, isLoading } = useQuery({
		queryKey: ["evm-contracts", chainInfo.chainId, page, pageSize],
		queryFn: () => api.getEvmContracts(pageSize, page * pageSize),
		staleTime: 15_000,
	})

	return (
		<div className={css({ display: "flex", flexDir: "column", gap: "6", w: "full" })}>
			<div>
				<h1 className={css({ fontSize: "3xl", fontWeight: "bold" })}>EVM Contracts</h1>
				<p className={css({ color: "fg.muted", mt: "1" })}>
					Deployed smart contracts on {chainInfo.chainId}
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Contract Registry</CardTitle>
					<CardDescription>
						{contracts ? `${contracts.length} contracts loaded` : "Loading..."}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<DataTable
						columns={columns}
						data={contracts ?? []}
						isLoading={isLoading}
						pageSize={pageSize}
						getRowId={(c) => c.address}
						emptyState={
							<div className={css({ textAlign: "center", py: "12", color: "fg.muted" })}>
								<Code className={css({ h: "12", w: "12", mx: "auto", mb: "4", opacity: "0.5" })} />
								<h3 className={css({ fontSize: "lg", fontWeight: "semibold", color: "fg.default", mb: "2" })}>No Contracts</h3>
								<p className={css({ maxW: "md", mx: "auto" })}>No EVM contracts have been deployed yet.</p>
							</div>
						}
					/>
				</CardContent>
			</Card>
		</div>
	)
}

export default EvmContractsPage
