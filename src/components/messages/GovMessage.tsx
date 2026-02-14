import { Vote, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { css } from "@/styled-system/css"
import { type MessageRendererProps, DetailRow, MessageHeader } from "./shared"

export function GovVoteMessage({ metadata }: MessageRendererProps) {
	return (
		<div className={css({ display: "flex", flexDir: "column", gap: "2" })}>
			<MessageHeader icon={Vote} label="Governance Vote" color="indigo.600" />
			{metadata.proposalId && (
				<div className={css({ p: "3", rounded: "lg", bg: "bg.muted", borderWidth: "1px", borderColor: "border.default" })}>
					<label className={css({ fontSize: "xs", fontWeight: "medium", color: "fg.muted", textTransform: "uppercase", letterSpacing: "wider", display: "block", mb: "2" })}>
						Proposal ID
					</label>
					<div className={css({ fontSize: "lg", fontWeight: "bold", color: "indigo.600" })}>
						#{metadata.proposalId}
					</div>
				</div>
			)}
			{metadata.voter && <DetailRow label="Voter" value={metadata.voter} copyable icon={Users} />}
			{metadata.option && (
				<div className={css({ p: "3", rounded: "lg", bg: "bg.muted" })}>
					<label className={css({ fontSize: "xs", fontWeight: "medium", color: "fg.muted", textTransform: "uppercase", letterSpacing: "wider", display: "block", mb: "2" })}>
						Vote
					</label>
					<Badge variant="outline">{metadata.option}</Badge>
				</div>
			)}
		</div>
	)
}
