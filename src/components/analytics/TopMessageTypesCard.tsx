import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { YaciAPIClient } from '@yaci/database-client'

const client = new YaciAPIClient(import.meta.env.VITE_POSTGREST_URL)

interface MessageTypeStats {
  type: string
  count: number
  percentage: number
  trend?: 'up' | 'down' | 'stable'
}

async function getTopMessageTypes(): Promise<MessageTypeStats[]> {
  // Use the client's getTransactionTypeDistribution method
  const typeData = await client.getTransactionTypeDistribution()

  // Calculate total and percentages
  const total = typeData.reduce((sum, d) => sum + d.count, 0)

  const stats: MessageTypeStats[] = typeData.map(({ type, count }) => {
    // Simplify type names (remove module path)
    const simplifiedType = type.split('.').pop() || type
    return {
      type: simplifiedType,
      count,
      percentage: (count / total) * 100,
      trend: 'stable' as const
    }
  })

  return stats
}

export function TopMessageTypesCard() {
  const { data, isLoading } = useQuery({
    queryKey: ['top-message-types'],
    queryFn: getTopMessageTypes,
    refetchInterval: 60000,
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
          Distribution of the most frequently used message types
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
