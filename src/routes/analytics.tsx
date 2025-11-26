import { Activity } from "lucide-react"
import { ActiveAddressesChart } from "@/components/analytics/ActiveAddressesChart"
import { BlockIntervalChart } from "@/components/analytics/BlockIntervalChart"
import { GasUsageChart } from "@/components/analytics/GasUsageChart"
import { NetworkMetricsCard } from "@/components/analytics/NetworkMetricsCard"
import { TopEventTypesCard } from "@/components/analytics/TopEventTypesCard"
import { TopMessageTypesCard } from "@/components/analytics/TopMessageTypesCard"
import { TransactionVolumeChart } from "@/components/analytics/TransactionVolumeChart"
import { TxTypeBreakdown } from "@/components/analytics/TxTypeBreakdown"
import { css } from "../../styled-system/css"

export const AnalyticsPage = () => {
	return (
		<div className={styles.page}>
			<div className={styles.headerRow}>
				<Activity className={styles.iconLg} />
				<div>
					<h1 className={styles.title}>Network Analytics</h1>
				</div>
			</div>
			<NetworkMetricsCard />
			<div className={styles.chartGrid}>
				<TransactionVolumeChart />
				<BlockIntervalChart />
			</div>
			<div className={styles.chartGrid}>
				<TxTypeBreakdown />
				<GasUsageChart />
				<ActiveAddressesChart />
			</div>
			<div className={styles.chartGrid}>
				<TopMessageTypesCard />
				<TopEventTypesCard />
			</div>
		</div>
	)
}

const styles = {
	page: css({ display: "flex", flexDirection: "column", gap: "6" }),
	headerRow: css({ display: "flex", alignItems: "center", gap: "3" }),
	iconLg: css({ h: "8", w: "8", color: "colorPalette.default" }),
	title: css({ fontSize: "3xl", fontWeight: "bold" }),
	subtitle: css({ color: "fg.muted" }),
	chartGrid: css({
		display: "grid",
		gap: "6",
		gridTemplateColumns: { base: "1fr", lg: "repeat(2, minmax(0, 1fr))" }
	})
}
