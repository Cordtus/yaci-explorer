import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { useConfig } from '@/contexts/ConfigContext'

interface EventTypeStats {
  type: string
  count: number
  percentage: number
  trend?: 'up' | 'down' | 'stable'
}

async function getTopEventTypes(baseUrl: string, config: { eventSampleLimit: number; eventTopN: number }): Promise<EventTypeStats[]> {
  if (!baseUrl) {
    throw new Error('POSTGREST_URL environment variable is not set')
  }

  const response = await fetch(
    `${baseUrl}/events_main?select=event_type&attr_index=eq.0&order=id.desc&limit=${config.eventSampleLimit}`
  )

  if (!response.ok) {
    throw new Error('Failed to fetch event types')
  }

  const events = await response.json()

  // Count occurrences per event type (one row per event via attr_index=0)
  const typeCounts: Record<string, number> = {}
  events.forEach((ev: any) => {
    const type = ev.event_type || 'Unknown'
    typeCounts[type] = (typeCounts[type] || 0) + 1
  })

  const total = events.length || 1

  const stats: EventTypeStats[] = Object.entries(typeCounts)
    .map(([type, count]) => ({
      type,
      count,
      percentage: (count / total) * 100,
      // Trend is marked stable for now; can be extended by comparing to a previous window
      trend: 'stable' as const,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, config.eventTopN)

  return stats
}

function getColorClass(index: number) {
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
    'bg-cyan-500',
  ]
  return colors[index % colors.length]
}

function getTrendIcon(trend?: string) {
  switch (trend) {
    case 'up':
      return <TrendingUp className="h-3 w-3 text-green-500" />
    case 'down':
      return <TrendingDown className="h-3 w-3 text-red-500" />
    default:
      return <Minus className="h-3 w-3 text-muted-foreground" />
  }
}

export function TopEventTypesCard() {
  const config = useConfig()
  const { analytics, postgrestUrl } = config

  const { data, isLoading } = useQuery({
    queryKey: [
      'top-event-types',
      analytics.eventSampleLimit,
      analytics.eventTopN,
    ],
    queryFn: () => getTopEventTypes(postgrestUrl, analytics),
    refetchInterval: analytics.eventRefetchMs,
  })

  const sampleLimitLabel = analytics.eventSampleLimit.toLocaleString()

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Top Event Types
          </CardTitle>
          <CardDescription>Most frequently emitted events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-8 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Top Event Types
          </CardTitle>
          <CardDescription>No events found in the sampled window</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Once transactions are included, this card will show the most common event types
            observed in the last {sampleLimitLabel} events.
          </p>
        </CardContent>
      </Card>
    )
  }

  const maxCount = Math.max(...data.map((d) => d.count))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Top Event Types
        </CardTitle>
        <CardDescription>
          Distribution of the most frequently emitted event types (last {sampleLimitLabel} events)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((stat, index) => (
            <div key={stat.type} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{stat.type}</span>
                  {getTrendIcon(stat.trend)}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>{stat.count.toLocaleString()} events</span>
                  <span>•</span>
                  <span>{stat.percentage.toFixed(1)}%</span>
                </div>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${getColorClass(index)}`}
                  style={{ width: `${(stat.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

