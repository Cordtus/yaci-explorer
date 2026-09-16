import { Component, type ErrorInfo, type ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { css } from "@/styled-system/css"

interface Props {
	children: ReactNode
	fallback?: ReactNode
}

interface State {
	hasError: boolean
	error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props)
		this.state = { hasError: false, error: null }
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error }
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error("ErrorBoundary caught:", error, errorInfo)
	}

	handleRetry = () => {
		this.setState({ hasError: false, error: null })
	}

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) return this.props.fallback

			return (
				<Card>
					<CardContent className={css({ py: "12", textAlign: "center" })}>
						<h2 className={css({ fontSize: "xl", fontWeight: "bold", mb: "2" })}>
							Something went wrong
						</h2>
						<p className={css({ color: "fg.muted", mb: "4", maxW: "md", mx: "auto" })}>
							{this.state.error?.message || "An unexpected error occurred"}
						</p>
						<Button onClick={this.handleRetry}>Try Again</Button>
					</CardContent>
				</Card>
			)
		}

		return this.props.children
	}
}
