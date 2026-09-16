import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { Activity } from "lucide-react"
import { useChain } from "@/contexts/ChainContext"
import { css } from "@/styled-system/css"

interface ValidatorSigningChartProps {
	consensusAddress: string | null | undefined
	limit?: number
}

/**
 * Grid of small colored squares showing recent block signing history for a validator.
 * Green = signed, red = missed.
 */
export function ValidatorSigningChart({ consensusAddress, limit = 200 }: ValidatorSigningChartProps) {
	const { api } = useChain()

	const { data, isLoading, error } = useQuery({
		queryKey: ["validator-block-signatures", consensusAddress, limit],
		queryFn: () => consensusAddress ? api.getValidatorBlockSignatures(consensusAddress, limit) : null,
		enabled: !!consensusAddress,
		staleTime: 15000,
		retry: 1,
	})

	if (!consensusAddress) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className={titleFlex}>
						<Activity className={icon} />
						Blocks Signed
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className={message}>No consensus address available</div>
				</CardContent>
			</Card>
		)
	}

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className={titleFlex}>
						<Activity className={icon} />
						Blocks Signed
					</CardTitle>
					<CardDescription>Recent block signing activity</CardDescription>
				</CardHeader>
				<CardContent>
					<div className={loadingContainer}>Loading signing data...</div>
				</CardContent>
			</Card>
		)
	}

	if (error || !data || data.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className={titleFlex}>
						<Activity className={icon} />
						Blocks Signed
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className={message}>
						{error ? "Failed to load signing data" : "No signing data available yet"}
					</div>
				</CardContent>
			</Card>
		)
	}

	const sortedData = [...data].sort((a, b) => a.height - b.height)

	const signedCount = sortedData.filter(d => d.signed).length
	const missedCount = sortedData.filter(d => !d.signed).length
	const signingPercent = ((signedCount / sortedData.length) * 100).toFixed(1)
	const minHeight = sortedData[0]?.height
	const maxHeight = sortedData[sortedData.length - 1]?.height

	return (
		<Card>
			<CardHeader>
				<CardTitle className={titleFlex}>
					<Activity className={icon} />
					Blocks Signed
				</CardTitle>
				<CardDescription>
					Last {sortedData.length} blocks (#{minHeight?.toLocaleString()} - #{maxHeight?.toLocaleString()}) | {signingPercent}% signed | {signedCount.toLocaleString()} signed, {missedCount.toLocaleString()} missed
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className={blockGrid}>
					{sortedData.map((d) => (
						<div
							key={d.height}
							className={d.signed ? blockSigned : blockMissed}
							title={`Block #${d.height.toLocaleString()} - ${d.signed ? "Signed" : "Missed"}`}
						/>
					))}
				</div>
				<div className={legend}>
					<span className={legendItem}>
						<span className={legendDotGreen} />
						Signed
					</span>
					<span className={legendItem}>
						<span className={legendDotRed} />
						Missed
					</span>
				</div>
			</CardContent>
		</Card>
	)
}

const titleFlex = css({ display: "flex", alignItems: "center", gap: "2" })
const icon = css({ h: "5", w: "5" })
const loadingContainer = css({ h: "100px", display: "flex", alignItems: "center", justifyContent: "center", color: "fg.muted" })
const message = css({ py: "8", textAlign: "center", color: "fg.muted" })
const blockGrid = css({ display: "flex", flexWrap: "wrap", gap: "1px" })
const blockSigned = css({ w: "6px", h: "6px", borderRadius: "1px", bg: "accent.default" })
const blockMissed = css({ w: "6px", h: "6px", borderRadius: "1px", bg: "red.500" })
const legend = css({ display: "flex", justifyContent: "center", gap: "4", mt: "3", fontSize: "xs", color: "fg.muted" })
const legendItem = css({ display: "flex", alignItems: "center", gap: "1" })
const legendDotGreen = css({ width: "8px", height: "8px", borderRadius: "full", bg: "accent.default" })
const legendDotRed = css({ width: "8px", height: "8px", borderRadius: "full", bg: "red.500" })
