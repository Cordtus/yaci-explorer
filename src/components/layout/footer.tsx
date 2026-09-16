import { getBrandingConfig } from "@/config/branding"
import { css } from "@/styled-system/css"

export function Footer() {
	const branding = getBrandingConfig()

	if (!branding.footerText) return null

	return (
		<footer className={css({
			borderTopWidth: "1px",
			py: "4",
			mt: "auto",
		})}>
			<div className={css({
				maxW: "7xl",
				mx: "auto",
				px: { base: "4", md: "6" },
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			})}>
				<span className={css({ fontSize: "xs", color: "fg.muted" })}>
					{branding.footerText}
				</span>
			</div>
		</footer>
	)
}
