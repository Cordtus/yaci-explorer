import { Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { css } from "@/styled-system/css"
import { type MessageRendererProps, DetailRow, MessageHeader } from "./shared"

export function AuthzExecMessage({ metadata }: MessageRendererProps) {
	const innerMsgs = metadata.msgs || []
	return (
		<div className={css({ display: "flex", flexDir: "column", gap: "2" })}>
			<MessageHeader icon={Users} label="Execute Authorized Action" color="pink.600" />
			{metadata.grantee && <DetailRow label="Grantee (Executor)" value={metadata.grantee} copyable icon={Users} />}
			{innerMsgs.length > 0 && (
				<div className={css({ p: "3", rounded: "lg", bg: "bg.muted", borderWidth: "1px", borderColor: "border.default" })}>
					<label className={css({ fontSize: "xs", fontWeight: "medium", color: "fg.muted", textTransform: "uppercase", letterSpacing: "wider", display: "block", mb: "2" })}>
						Executing {innerMsgs.length} Authorized {innerMsgs.length === 1 ? "Message" : "Messages"}
					</label>
					<div className={css({ display: "flex", flexWrap: "wrap", gap: "2" })}>
						{innerMsgs.map((msg: any, idx: number) => (
							<Badge key={idx} variant="outline">
								{msg["@type"]?.split(".").pop() || "Unknown"}
							</Badge>
						))}
					</div>
				</div>
			)}
		</div>
	)
}
