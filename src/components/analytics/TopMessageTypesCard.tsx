import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MessageTypeStats {
  type: string
  count: number
  percentage: number
  trend?: 'up' | 'down' | 'stable'
}

async function getTopMessageTypes(): Promise<MessageTypeStats[]> {
  const baseUrl = process.env.NEXT_PUBLIC_POSTGREST_URL
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_POSTGREST_URL environment variable is not set')
  }

  // Fetch message types from the last 10000 messages
  const response = await fetch(
    `${baseUrl}/messages_main?select=type&order=tx_id.desc&limit=10000`
  )

  if (!response.ok) {
    throw new Error('Failed to fetch message types')
  }

  const messages = await response.json()

  // Count occurrences
  const typeCounts: { [key: string]: number } = {}
  messages.forEach((msg: any) => {
    const type = msg.type || 'Unknown'
    // Simplify type names (remove module path)
    const simplifiedType = type.split('.').pop() || type
    typeCounts[simplifiedType] = (typeCounts[simplifiedType] || 0) + 1
  })

  // Convert to array and calculate percentages
  const total = messages.length
  const stats: MessageTypeStats[] = Object.entries(typeCounts)
    .map(([type, count]) => ({
      type,
      count,
      percentage: (count / total) * 100,
      trend: 'stable' as const // In a real app, you'd compare with previous period
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10) // Top 10

  return stats
}

export function TopMessageTypesCard() {
  const { data, isLoading } = useQuery({
    queryKey: ['top-message-types'],
    queryFn: getTopMessageTypes,
    refetchInterval: 60000, // Refresh every minute
  })

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Top Message Types
          </CardTitle>
          <CardDescription>Most frequently used message types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-8 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const maxCount = Math.max(...data.map(d => d.count))

  // Color classes for the bars
  const getColorClass = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-teal-500',
      'bg-cyan-500'
    ]
    return colors[index % colors.length]
  }

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-500" />
      default:
        return <Minus className="h-3 w-3 text-muted-foreground" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Top Message Types
        </CardTitle>
        <CardDescription>
          Distribution of the most frequently used message types (last 10,000 messages)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((stat, index) => (
            <div key={stat.type} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    #{index + 1}
                  </span>
                  <span className="font-medium truncate max-w-[200px]" title={stat.type}>
                    {stat.type}
                  </span>
                  {getTrendIcon(stat.trend)}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">
                    {stat.percentage.toFixed(1)}%
                  </span>
                  <span className="font-mono font-medium">
                    {stat.count.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="relative h-6 bg-muted rounded-md overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 ${getColorClass(index)} opacity-80 transition-all duration-500`}
                  style={{ width: `${(stat.count / maxCount) * 100}%` }}
                />
                <div className="absolute inset-0 flex items-center px-2">
                  <span className="text-xs font-medium text-white mix-blend-difference">
                    {stat.count > 1000 ? `${(stat.count / 1000).toFixed(1)}k` : stat.count}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Messages:</span>
              <span className="ml-2 font-medium">
                {data.reduce((sum, d) => sum + d.count, 0).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Unique Types:</span>
              <span className="ml-2 font-medium">{data.length}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}