import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, TrendingUp, Clock, Database, Users, Zap } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { YaciAPIClient } from '@yaci/database-client'

const client = new YaciAPIClient(import.meta.env.VITE_POSTGREST_URL)

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
  const baseUrl = import.meta.env.VITE_POSTGREST_URL
  if (!baseUrl) {
    throw new Error('VITE_POSTGREST_URL environment variable is not set')
  }

  // Fetch multiple data points in parallel
  const [blocksResponse, txResponse, messagesResponse] = await Promise.all([
    fetch(
      `${baseUrl}/blocks_raw?order=id.desc&limit=100`,
      { headers: { 'Prefer': 'count=exact' } }
    ),
    fetch(
      `${baseUrl}/transactions_main?order=height.desc&limit=1000`,
      { headers: { 'Prefer': 'count=exact' } }
    ),
    fetch(
      `${baseUrl}/messages_main?select=sender,mentions,metadata&order=id.desc&limit=2000`,
      { headers: { 'Prefer': 'count=exact' } }
    )
  ])

  const blocks = await blocksResponse.json()
  const transactions = await txResponse.json()
  const totalBlocks = parseInt(blocksResponse.headers.get('content-range')?.split('/')[1] || '0')
  const totalTxs = parseInt(txResponse.headers.get('content-range')?.split('/')[1] || '0')

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
    queryKey: ['network-metrics'],
    queryFn: getNetworkMetrics,
    refetchInterval: 10000, // Poll every 10 seconds
  })

  if (isLoading || !metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Network Overview</CardTitle>
          <CardDescription>Loading metrics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-8 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
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
      color: 'text-blue-500'
    },
    {
      icon: Database,
      label: 'Total Transactions',
      value: formatNumber(metrics.totalTransactions),
      subtext: `${metrics.txPerBlock} per block`,
      color: 'text-green-500'
    },
    {
      icon: Clock,
      label: 'Block Time',
      value: `${metrics.avgBlockTime.toFixed(2)}s`,
      subtext: 'average',
      color: 'text-purple-500'
    },
    {
      icon: Users,
      label: 'Active Validators',
      value: metrics.activeValidators.toString(),
      subtext: 'participating',
      color: 'text-orange-500'
    },
    {
      icon: TrendingUp,
      label: 'Success Rate',
      value: `${metrics.successRate.toFixed(1)}%`,
      subtext: 'transactions',
      color: 'text-emerald-500'
    },
    {
      icon: Zap,
      label: 'Avg Gas Used',
      value: formatNumber(metrics.avgGasUsed),
      subtext: 'per transaction',
      color: 'text-yellow-500'
    },
    {
      icon: Database,
      label: 'Total Blocks',
      value: formatNumber(metrics.totalBlocks),
      subtext: 'indexed',
      color: 'text-indigo-500'
    },
    {
      icon: Users,
      label: 'Active Addresses',
      value: metrics.uniqueAddresses.toString(),
      subtext: 'recent activity',
      color: 'text-pink-500'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Network Overview</CardTitle>
        <CardDescription>
          Real-time metrics and statistics for the blockchain network
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {metricsData.map((metric, index) => {
            const Icon = metric.icon
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${metric.color}`} />
                  <span className="text-sm font-medium text-muted-foreground">
                    {metric.label}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <div className="text-xs text-muted-foreground">{metric.subtext}</div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
