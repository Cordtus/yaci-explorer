import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, TrendingUp, Clock, Database, Users, Zap } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { appConfig } from '@/config/app'
import { css } from '@/styled-system/css'
import { getEnv } from '@/lib/env'

interface NetworkMetrics {
  latestHeight: number
  totalTransactions: number
  avgBlockTime: number
  activeValidators: number
  totalBlocks: number
  lastBlockTime: string
  txPerBlock: number
  successRate: number
  avgGasUsed: number
  uniqueAddresses: number
}

async function getNetworkMetrics(): Promise<NetworkMetrics> {
  const baseUrl = getEnv('VITE_POSTGREST_URL', 'http://localhost:3000')
  if (!baseUrl) {
    throw new Error('VITE_POSTGREST_URL is not set')
  }

  // Fetch multiple data points in parallel
  const [blocksResponse, txResponse, messagesResponse] = await Promise.all([
    fetch(
      `${baseUrl}/blocks_raw?order=id.desc&limit=${appConfig.analytics.networkBlocksWindow}`,
      { headers: { 'Prefer': 'count=exact' } }
    ),
    fetch(
      `${baseUrl}/transactions_main?order=height.desc&limit=${appConfig.analytics.networkTxWindow}`,
      { headers: { 'Prefer': 'count=exact' } }
    ),
    fetch(
      `${baseUrl}/messages_main?select=sender,mentions,metadata&order=id.desc&limit=${appConfig.analytics.networkMessageWindow}`,
      { headers: { 'Prefer': 'count=exact' } }
    )
  ])

  const blocks = await blocksResponse.json()
  const transactions = await txResponse.json()
  const totalBlocks = parseInt(blocksResponse.headers.get('content-range')?.split('/')[1] || '0', 10)
  const totalTxs = parseInt(txResponse.headers.get('content-range')?.split('/')[1] || '0', 10)

  // Calculate average block time
  let avgBlockTime = 6.0
  const blockTimes: number[] = []
  for (let i = 0; i < Math.min(blocks.length - 1, 50); i++) {
    const currentTime = new Date(blocks[i].data?.block?.header?.time).getTime()
    const previousTime = new Date(blocks[i + 1].data?.block?.header?.time).getTime()
    const diff = (currentTime - previousTime) / 1000
    if (diff > 0 && diff < 100) {
      blockTimes.push(diff)
    }
  }
  if (blockTimes.length > 0) {
    avgBlockTime = blockTimes.reduce((a, b) => a + b, 0) / blockTimes.length
  }

  // Calculate success rate (error field is null for successful transactions)
  const successfulTxs = transactions.filter((tx: any) => !tx.error || tx.error === null).length
  const successRate = transactions.length > 0 ? (successfulTxs / transactions.length) * 100 : 100

  // Calculate average gas used from fee field (fee.gasLimit contains the gas)
  const gasValues: number[] = transactions
    .filter((tx: any) => tx.fee?.gasLimit)
    .map((tx: any) => parseInt(tx.fee.gasLimit, 10))
  const avgGasUsed = gasValues.length > 0
    ? Math.round(gasValues.reduce((a: number, b: number) => a + b, 0) / gasValues.length)
    : 0

  // Get unique signer addresses from messages
  const messages = await messagesResponse.json()
  const addresses = new Set<string>()

  // Extract unique addresses from messages
  messages.forEach((msg: any) => {
    // Add direct sender if available
    if (msg.sender && msg.sender.trim() !== '') {
      addresses.add(msg.sender)
    }

    // For messages without sender, extract from metadata
    if (!msg.sender && msg.metadata) {
      // Common signer fields in metadata
      const signerFields = ['delegatorAddress', 'sender', 'from_address', 'depositor', 'granter', 'validator', 'creator', 'owner']
      for (const field of signerFields) {
        if (msg.metadata[field] && typeof msg.metadata[field] === 'string') {
          const addr = msg.metadata[field]
          // Check if it looks like a valid bech32 address (any chain)
          // Bech32 addresses typically have format: prefix + '1' + alphanumeric
          // and are at least 20 characters long
          if (addr.includes('1') && addr.length > 20 && /^[a-z0-9]+$/.test(addr)) {
            addresses.add(addr)
            break // Use first valid address found
          }
        }
      }
    }
  })

  const latestBlock = blocks[0]
  // Try multiple paths for validator count
  const validators =
    latestBlock?.data?.block?.last_commit?.signatures?.length ||
    latestBlock?.data?.block?.lastCommit?.signatures?.length ||
    latestBlock?.data?.lastCommit?.signatures?.length ||
    0

  return {
    latestHeight: latestBlock?.id || 0,
    totalTransactions: totalTxs,
    avgBlockTime,
    activeValidators: validators,
    totalBlocks,
    lastBlockTime: latestBlock?.data?.block?.header?.time || new Date().toISOString(),
    txPerBlock: totalBlocks > 0 ? Math.round(totalTxs / totalBlocks) : 0,
    successRate,
    avgGasUsed,
    uniqueAddresses: addresses.size
  }
}

export function NetworkMetricsCard() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['network-metrics', appConfig.analytics.networkBlocksWindow, appConfig.analytics.networkTxWindow, appConfig.analytics.networkMessageWindow],
    queryFn: getNetworkMetrics,
    refetchInterval: appConfig.analytics.networkRefetchMs,
  })

  if (isLoading || !metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Network Overview</CardTitle>
          <CardDescription>Loading metrics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={styles.animatePulse}>
            <div className={styles.skeletonGrid}>
              {[...Array(8)].map((_, i) => (
                <div key={i} className={styles.skeletonItem}>
                  <div className={styles.skeletonBar}></div>
                  <div className={styles.skeletonText}></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate time since last block
  const timeSinceLastBlock = Math.floor(
    (Date.now() - new Date(metrics.lastBlockTime).getTime()) / 1000
  )

  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const metricsData = [
    {
      icon: Activity,
      label: 'Latest Block',
      value: metrics.latestHeight.toLocaleString(),
      subtext: `${timeSinceLastBlock}s ago`,
      color: 'blue.500'
    },
    {
      icon: Database,
      label: 'Total Transactions',
      value: formatNumber(metrics.totalTransactions),
      subtext: `${metrics.txPerBlock} per block`,
      color: 'green.500'
    },
    {
      icon: Clock,
      label: 'Block Time',
      value: `${metrics.avgBlockTime.toFixed(2)}s`,
      subtext: 'average',
      color: 'purple.500'
    },
    {
      icon: Users,
      label: 'Active Validators',
      value: metrics.activeValidators.toString(),
      subtext: 'participating',
      color: 'orange.500'
    },
    {
      icon: TrendingUp,
      label: 'Success Rate',
      value: `${metrics.successRate.toFixed(1)}%`,
      subtext: 'transactions',
      color: 'emerald.500'
    },
    {
      icon: Zap,
      label: 'Avg Gas Used',
      value: formatNumber(metrics.avgGasUsed),
      subtext: 'per transaction',
      color: 'yellow.500'
    },
    {
      icon: Database,
      label: 'Total Blocks',
      value: formatNumber(metrics.totalBlocks),
      subtext: 'indexed',
      color: 'indigo.500'
    },
    {
      icon: Users,
      label: 'Active Addresses',
      value: metrics.uniqueAddresses.toString(),
      subtext: 'recent activity',
      color: 'pink.500'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className={styles.title}>Network Overview</CardTitle>
        <CardDescription>
          Real-time metrics and statistics for the blockchain network
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className={styles.metricsGrid}>
          {metricsData.map((metric, index) => {
            const Icon = metric.icon
            return (
              <div key={index} className={styles.metricItem}>
                <div className={styles.metricHeader}>
                  <Icon className={css({ h: '5', w: '5', color: metric.color })} />
                  <span className={styles.metricLabel}>
                    {metric.label}
                  </span>
                </div>
                <div className={styles.metricValues}>
                  <div className={styles.metricValue}>{metric.value}</div>
                  <div className={styles.metricSubtext}>{metric.subtext}</div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

const styles = {
  title: css({ fontSize: '2xl' }),
  animatePulse: css({ animation: 'pulse', display: 'flex', flexDirection: 'column', gap: '4' }),
  skeletonGrid: css({ display: 'grid', gridTemplateColumns: { base: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: '4' }),
  skeletonItem: css({ display: 'flex', flexDirection: 'column', gap: '2' }),
  skeletonBar: css({ h: '8', bg: 'muted', rounded: 'md' }),
  skeletonText: css({ h: '4', bg: 'muted', rounded: 'md', w: '2/3' }),
  metricsGrid: css({ display: 'grid', gridTemplateColumns: { base: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: '6' }),
  metricItem: css({ display: 'flex', flexDirection: 'column', gap: '2' }),
  metricHeader: css({ display: 'flex', alignItems: 'center', gap: '2' }),
  metricLabel: css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.muted' }),
  metricValues: css({ display: 'flex', flexDirection: 'column', gap: '1' }),
  metricValue: css({ fontSize: '2xl', fontWeight: 'bold' }),
  metricSubtext: css({ fontSize: 'xs', color: 'fg.muted' }),
}
