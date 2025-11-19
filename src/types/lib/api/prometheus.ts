export interface PrometheusMetric {
  name: string
  type: string
  help: string
  values: Array<{
    labels: Record<string, string>
    value: number
    timestamp?: number
  }>
}

export interface ParsedMetrics {
  [key: string]: PrometheusMetric
}
