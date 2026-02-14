import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router"
import { Code, ExternalLink } from "lucide-react"
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
import { truncateAddress } from "@/lib/address"
import { getFunctionSignature } from "@/lib/4byte"
import { css } from "@/styled-system/css"

interface ContractCall {
	tx_id: string
	hash: string
	from: string
	value: string
	gas_used: number | null
	status: number
	function_name: string | null
	function_signature: string | null
	height: number
}

interface FunctionStat {
	function_name: string | null
	function_signature: string | null
	call_count: number
}

const callColumnHelper = createColumnHelper<ContractCall>()

const callColumns: ColumnDef<ContractCall, any>[] = [
	callColumnHelper.accessor("hash", {
		header: "Tx Hash",
		enableSorting: false,
		cell: ({ getValue }) => (
			<Link
				to={`/tx/${getValue()}`}
				className={css({ fontFamily: "mono", fontSize: "xs", color: "accent.default", _hover: { textDecoration: "underline" } })}
			>
				{truncateAddress(getValue(), 8)}
			</Link>
		),
	}),
	callColumnHelper.accessor("from", {
		header: "From",
		enableSorting: false,
		cell: ({ getValue }) => (
			<Link
				to={`/addr/${getValue()}`}
				className={css({ fontFamily: "mono", fontSize: "xs", _hover: { color: "accent.default" } })}
			>
				{truncateAddress(getValue(), 6)}
			</Link>
		),
	}),
	callColumnHelper.accessor("function_name", {
		header: "Function",
		cell: ({ getValue, row }) => {
			const name = getValue()
			const sig = row.original.function_signature
			return (
				<span className={css({ fontFamily: "mono", fontSize: "xs" })} title={sig || undefined}>
					{name || (sig ? sig.slice(0, 10) : "unknown")}
				</span>
			)
		},
	}),
	callColumnHelper.accessor("status", {
		header: "Status",
		cell: ({ getValue }) => (
			getValue() === 1
				? <Badge variant="success">OK</Badge>
				: <Badge variant="destructive">Failed</Badge>
		),
	}),
	callColumnHelper.accessor("height", {
		header: "Block",
		cell: ({ getValue }) => (
			<Link
				to={`/blocks/${getValue()}`}
				className={css({ fontFamily: "mono", fontSize: "sm", _hover: { color: "accent.default" } })}
			>
				{getValue().toLocaleString()}
			</Link>
		),
	}),
]

interface ContractDetailsProps {
	address: string
}

export function ContractDetails({ address }: ContractDetailsProps) {
	const { api, chainInfo } = useChain()
	const [page, setPage] = useState(0)
	const pageSize = 20

	const { data: contract } = useQuery({
		queryKey: ["evm-contract-detail", chainInfo.chainId, address],
		queryFn: () => api.getEvmContractDetails(address),
		staleTime: 60_000,
	})

	const { data: callsData, isLoading: callsLoading } = useQuery({
		queryKey: ["evm-contract-calls", chainInfo.chainId, address, page, pageSize],
		queryFn: () => api.getEvmContractCalls(address, pageSize, page * pageSize),
		staleTime: 15_000,
	})

	const { data: functionStats } = useQuery({
		queryKey: ["evm-contract-fn-stats", chainInfo.chainId, address],
		queryFn: () => api.getEvmContractFunctionStats(address),
		staleTime: 60_000,
	})

	if (!contract) return null

	return (
		<div className={css({ display: "flex", flexDir: "column", gap: "4" })}>
			<Card>
				<CardHeader>
					<CardTitle className={css({ display: "flex", alignItems: "center", gap: "2" })}>
						<Code className={css({ h: "5", w: "5" })} />
						Contract Details
					</CardTitle>
					<CardDescription>{contract.name || "Unnamed contract"}</CardDescription>
				</CardHeader>
				<CardContent>
					<div className={css({ display: "grid", gridTemplateColumns: { base: "1fr", md: "repeat(2, 1fr)" }, gap: "4" })}>
						<div>
							<span className={labelStyle}>Creator</span>
							{contract.creator ? (
								<Link
									to={`/addr/${contract.creator}`}
									className={css({ fontFamily: "mono", fontSize: "xs", color: "accent.default", _hover: { textDecoration: "underline" } })}
								>
									{truncateAddress(contract.creator, 10)}
								</Link>
							) : (
								<span className={css({ color: "fg.muted" })}>Unknown</span>
							)}
						</div>
						<div>
							<span className={labelStyle}>Deploy Transaction</span>
							{contract.creation_tx ? (
								<Link
									to={`/tx/${contract.creation_tx}`}
									className={css({ fontFamily: "mono", fontSize: "xs", color: "accent.default", _hover: { textDecoration: "underline" } })}
								>
									{truncateAddress(contract.creation_tx, 10)}
								</Link>
							) : (
								<span className={css({ color: "fg.muted" })}>-</span>
							)}
						</div>
						<div>
							<span className={labelStyle}>Deploy Block</span>
							<Link
								to={`/blocks/${contract.creation_height}`}
								className={css({ fontFamily: "mono", fontSize: "sm", _hover: { color: "accent.default" } })}
							>
								#{contract.creation_height.toLocaleString()}
							</Link>
						</div>
						<div>
							<span className={labelStyle}>Verified</span>
							{contract.is_verified
								? <Badge variant="success">Verified</Badge>
								: <Badge variant="outline">Unverified</Badge>
							}
						</div>
						{contract.bytecode_hash && (
							<div className={css({ gridColumn: "span 2" })}>
								<span className={labelStyle}>Bytecode Hash</span>
								<span className={css({ fontFamily: "mono", fontSize: "xs", color: "fg.muted", wordBreak: "break-all" })}>
									{contract.bytecode_hash}
								</span>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{functionStats && functionStats.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Function Calls</CardTitle>
						<CardDescription>Most called functions on this contract</CardDescription>
					</CardHeader>
					<CardContent>
						<div className={css({ display: "flex", flexWrap: "wrap", gap: "2" })}>
							{functionStats.slice(0, 10).map((stat) => (
								<div
									key={stat.function_signature || stat.function_name || "unknown"}
									className={css({
										display: "inline-flex",
										alignItems: "center",
										gap: "2",
										px: "3",
										py: "1.5",
										rounded: "md",
										bg: "bg.muted",
										fontSize: "xs",
									})}
								>
									<span className={css({ fontFamily: "mono", fontWeight: "medium" })}>
										{stat.function_name || stat.function_signature?.slice(0, 10) || "unknown"}
									</span>
									<Badge variant="outline">{stat.call_count}</Badge>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader>
					<CardTitle>Recent Calls</CardTitle>
					<CardDescription>
						{callsData ? `${callsData.total} total calls` : "Loading..."}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<DataTable
						columns={callColumns}
						data={callsData?.data ?? []}
						isLoading={callsLoading}
						pageSize={pageSize}
						getRowId={(c) => c.tx_id}
						emptyState={
							<div className={css({ py: "8", textAlign: "center", color: "fg.muted" })}>
								No function calls recorded
							</div>
						}
					/>
				</CardContent>
			</Card>
		</div>
	)
}

const labelStyle = css({
	display: "block",
	fontSize: "xs",
	fontWeight: "medium",
	color: "fg.muted",
	textTransform: "uppercase",
	letterSpacing: "wider",
	mb: "1",
})
