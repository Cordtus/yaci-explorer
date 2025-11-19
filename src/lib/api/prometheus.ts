/**
 * Prometheus Metrics Client
 * Fetches and parses metrics from CometBFT/Tendermint Prometheus exporter
 */
import { type ParsedMetrics, type PrometheusMetric } from '@/types/lib/api/prometheus'

/**
 * Parse Prometheus text format into structured data
 */
function parsePrometheusText(text: string): ParsedMetrics {
  const lines = text.split('\n')
  const metrics: ParsedMetrics = {}
  let currentMetric: Partial<PrometheusMetric> = {}
  let currentName = ''

  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) continue

    // Parse HELP line
    if (line.startsWith('# HELP ')) {
      const match = line.match(/# HELP (\S+) (.+)/)
      if (match) {
        currentName = match[1]
        currentMetric = {
          name: currentName,
          help: match[2],
          values: [],
        }
      }
      continue
    }

    // Parse TYPE line
    if (line.startsWith('# TYPE ')) {
      const match = line.match(/# TYPE (\S+) (\S+)/)
      if (match && currentMetric.name === match[1]) {
        currentMetric.type = match[2]
      }
      continue
    }

    // Skip other comments
    if (line.startsWith('#')) continue

    // Parse metric value line
    const metricMatch = line.match(/^(\S+?)(\{[^}]*\})?\s+([^\s]+)(?:\s+(\d+))?$/)
    if (metricMatch) {
      const [, name, labelsStr, valueStr, timestampStr] = metricMatch

      // If this is a new metric, save the previous one
      if (currentName && currentName !== name && currentMetric.name) {
        metrics[currentMetric.name] = currentMetric as PrometheusMetric
        currentMetric = {
          name,
          type: 'untyped',
          help: '',
          values: [],
        }
        currentName = name
      }

      // Parse labels
      const labels: Record<string, string> = {}
      if (labelsStr) {
        const labelMatches = labelsStr.matchAll(/(\w+)="([^"]*)"/g)
        for (const [, key, value] of labelMatches) {
          labels[key] = value
        }
      }

      // Parse value
      const value = parseFloat(valueStr)
      const timestamp = timestampStr ? parseInt(timestampStr) : undefined

      if (!currentMetric.values) {
        currentMetric.values = []
      }
      currentMetric.values.push({ labels, value, timestamp })
    }
  }

  // Save last metric
  if (currentMetric.name && currentMetric.values) {
    metrics[currentMetric.name] = currentMetric as PrometheusMetric
  }

  return metrics
}

/**
 * Fetch all metrics from Prometheus endpoint
 * Note: Prometheus endpoint should be proxied through Caddy/nginx for HTTPS
 * For now, we disable browser-based Prometheus fetching to avoid mixed content errors
 */
export async function fetchPrometheusMetrics(
  endpoint?: string
): Promise<ParsedMetrics> {
  // Disable Prometheus fetching from browser to avoid mixed content errors
  // Metrics should be fetched server-side or through a proper HTTPS proxy
  throw new Error('Prometheus metrics fetching disabled - requires HTTPS endpoint')

  // Keeping this code commented for future HTTPS implementation
  /*
  const response = await fetch(endpoint!, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch Prometheus metrics: ${response.statusText}`)
  }

  const text = await response.text()
  return parsePrometheusText(text)
  */
}

/**
 * Get a specific metric by name
 */
export async function getMetric(
  metricName: string,
  endpoint?: string
): Promise<PrometheusMetric | null> {
  const metrics = await fetchPrometheusMetrics(endpoint)
  return metrics[metricName] || null
}

/**
 * Get the latest value for a gauge metric
 */
export async function getGaugeValue(
  metricName: string,
  labels?: Record<string, string>,
  endpoint?: string
): Promise<number | null> {
  const metric = await getMetric(metricName, endpoint)
  if (!metric) return null

  // If labels provided, find matching value
  if (labels) {
    const match = metric.values.find((v) => {
      return Object.entries(labels).every(([key, value]) => v.labels[key] === value)
    })
    return match?.value ?? null
  }

  // Otherwise return first value
  return metric.values[0]?.value ?? null
}

/**
 * Get histogram buckets for a metric
 */
export async function getHistogramBuckets(
  metricName: string,
  labels?: Record<string, string>,
  endpoint?: string
): Promise<Array<{ le: string; count: number }>> {
  const metric = await getMetric(`${metricName}_bucket`, endpoint)
  if (!metric) return []

  const buckets = metric.values
    .filter((v) => {
      if (!labels) return true
      return Object.entries(labels).every(([key, value]) => v.labels[key] === value)
    })
    .map((v) => ({
      le: v.labels.le || '+Inf',
      count: v.value,
    }))
    .sort((a, b) => {
      const aVal = a.le === '+Inf' ? Infinity : parseFloat(a.le)
      const bVal = b.le === '+Inf' ? Infinity : parseFloat(b.le)
      return aVal - bVal
    })

  return buckets
}

/**
 * Get summary quantiles for a metric
 */
export async function getSummaryQuantiles(
  metricName: string,
  labels?: Record<string, string>,
  endpoint?: string
): Promise<Array<{ quantile: string; value: number }>> {
  const metric = await getMetric(metricName, endpoint)
  if (!metric) return []

  return metric.values
    .filter((v) => {
      if (!v.labels.quantile) return false
      if (!labels) return true
      return Object.entries(labels).every(([key, value]) => v.labels[key] === value)
    })
    .map((v) => ({
      quantile: v.labels.quantile,
      value: v.value,
    }))
}

/**
 * Network Health Metrics - Convenience functions
 */
export async function getNetworkHealth(endpoint?: string) {
  const metrics = await fetchPrometheusMetrics(endpoint)

  return {
    // Consensus metrics
    validators: metrics['cometbft_consensus_validators']?.values[0]?.value ?? 0,
    byzantineValidators:
      metrics['cometbft_consensus_byzantine_validators']?.values[0]?.value ?? 0,
    missingValidators:
      metrics['cometbft_consensus_missing_validators']?.values[0]?.value ?? 0,
    rounds: metrics['cometbft_consensus_rounds']?.values[0]?.value ?? 0,
    height: metrics['cometbft_consensus_height']?.values[0]?.value ?? 0,

    // Block metrics
    blockSize: metrics['cometbft_consensus_block_size_bytes']?.values[0]?.value ?? 0,
    numTxs: metrics['cometbft_consensus_num_txs']?.values[0]?.value ?? 0,
    totalTxs: metrics['cometbft_consensus_total_txs']?.values[0]?.value ?? 0,
    blockInterval:
      metrics['cometbft_consensus_block_interval_seconds']?.values[0]?.value ?? 0,

    // Mempool metrics
    mempoolSize: metrics['cometbft_mempool_size']?.values[0]?.value ?? 0,
    mempoolBytes: metrics['cometbft_mempool_size_bytes']?.values[0]?.value ?? 0,
    failedTxs: metrics['cometbft_mempool_failed_txs']?.values[0]?.value ?? 0,
    evictedTxs: metrics['cometbft_mempool_evicted_txs']?.values[0]?.value ?? 0,

    // P2P metrics
    peers: metrics['cometbft_p2p_peers']?.values[0]?.value ?? 0,
  }
}

/**
 * Get ABCI method timing statistics
 */
export async function getABCITiming(endpoint?: string) {
  const metrics = await fetchPrometheusMetrics(endpoint)
  const timingMetric = metrics['cometbft_abci_connection_method_timing_bucket']

  if (!timingMetric) return {}

  const methods = ['check_tx', 'finalize_block', 'commit']
  const result: Record<string, Array<{ le: string; count: number }>> = {}

  for (const method of methods) {
    result[method] = timingMetric.values
      .filter((v) => v.labels.method === method)
      .map((v) => ({
        le: v.labels.le || '+Inf',
        count: v.value,
      }))
      .sort((a, b) => {
        const aVal = a.le === '+Inf' ? Infinity : parseFloat(a.le)
        const bVal = b.le === '+Inf' ? Infinity : parseFloat(b.le)
        return aVal - bVal
      })
  }

  return result
}
