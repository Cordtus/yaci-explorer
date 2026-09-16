import { useDenom } from "@/contexts/DenomContext"
import { getMessageRenderer, type MessageMetadata, type MessageEvent } from "./messages"

interface MessageDetailsProps {
	type: string
	metadata?: MessageMetadata
	events?: MessageEvent[]
}

export function MessageDetails({ type, metadata, events }: MessageDetailsProps) {
	const { getDenomDisplay } = useDenom()

	if (!metadata) return null

	const Renderer = getMessageRenderer(type)
	if (!Renderer) return null

	return <Renderer metadata={metadata} events={events} getDenomDisplay={getDenomDisplay} />
}
