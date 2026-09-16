import type { ReactNode } from "react"
import { Navigate } from "react-router"
import type { FeatureKey } from "@/config/chains"
import { useChain } from "@/contexts/ChainContext"

interface FeatureGateProps {
	feature: FeatureKey
	children: ReactNode
}

/** Renders children only when the selected chain enables `feature`; otherwise redirects home. */
export function FeatureGate({ feature, children }: FeatureGateProps) {
	const { hasFeature } = useChain()
	if (!hasFeature(feature)) return <Navigate to="/" replace />
	return <>{children}</>
}
