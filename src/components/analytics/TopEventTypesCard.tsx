import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { appConfig } from '@/config/app'
import { css } from '@/styled-system/css'
import { getEnv } from '@/lib/env'

interface EventTypeStats {
  type: string
  count: number
  percentage: number
  trend?: 'up' | 'down' | 'stable'
}

async function getTopEventTypes(): Promise<EventTypeStats[]> {
  const baseUrl = getEnv('VITE_POSTGREST_URL', '/api')
  if (!baseUrl) {
    return []
  }

  const response = await fetch(
    `${baseUrl}/events_main?select=event_type&attr_index=eq.0&order=id.desc&limit=${appConfig.analytics.eventSampleLimit}`
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
    .slice(0, appConfig.analytics.eventTopN)

  return stats
}

function getColorStyle(index: number) {
  const colors = [
    'blue.500',
    'green.500',
    'purple.500',
    'orange.500',
    'pink.500',
    'indigo.500',
    'yellow.500',
    'red.500',
    'teal.500',
    'cyan.500',
  ]
  return colors[index % colors.length]
}

function getTrendIcon(trend?: string) {
  switch (trend) {
    case 'up':
      return <TrendingUp className={css({ h: '3', w: '3', color: 'green.500' })} />
    case 'down':
      return <TrendingDown className={css({ h: '3', w: '3', color: 'red.500' })} />
    default:
      return <Minus className={css({ h: '3', w: '3', color: 'fg.muted' })} />
  }
}

export function TopEventTypesCard() {
  const { data, isLoading } = useQuery({
    queryKey: [
      'top-event-types',
      appConfig.analytics.eventSampleLimit,
      appConfig.analytics.eventTopN,
    ],
    queryFn: getTopEventTypes,
    refetchInterval: appConfig.analytics.eventRefetchMs,
  })

  const sampleLimitLabel = appConfig.analytics.eventSampleLimit.toLocaleString()

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className={styles.titleFlex}>
            <BarChart3 className={styles.icon} />
            Top Event Types
          </CardTitle>
          <CardDescription>Most frequently emitted events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={styles.spaceY2}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className={styles.animatePulse}>
                <div className={styles.skeletonBar} />
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
          <CardTitle className={styles.titleFlex}>
            <BarChart3 className={styles.icon} />
            Top Event Types
          </CardTitle>
          <CardDescription>No events found in the sampled window</CardDescription>
        </CardHeader>
        <CardContent>
          <p className={styles.mutedText}>
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
        <CardTitle className={styles.titleFlex}>
          <BarChart3 className={styles.icon} />
          Top Event Types
        </CardTitle>
        <CardDescription>
          Distribution of the most frequently emitted event types (last {sampleLimitLabel} events)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className={styles.spaceY4}>
          {data.map((stat, index) => (
            <div key={stat.type} className={styles.spaceY2}>
              <div className={styles.statHeader}>
                <div className={styles.statLabel}>
                  <span className={styles.fontMedium}>{stat.type}</span>
                  {getTrendIcon(stat.trend)}
                </div>
                <div className={styles.statValues}>
                  <span>{stat.count.toLocaleString()} events</span>
                  <span>•</span>
                  <span>{stat.percentage.toFixed(1)}%</span>
                </div>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={css({ h: 'full', rounded: 'full', bg: getColorStyle(index) })}
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

const styles = {
  titleFlex: css({ display: 'flex', alignItems: 'center', gap: '2' }),
  icon: css({ h: '5', w: '5' }),
  spaceY2: css({ display: 'flex', flexDirection: 'column', gap: '2' }),
  spaceY4: css({ display: 'flex', flexDirection: 'column', gap: '4' }),
  animatePulse: css({ animation: 'pulse' }),
  skeletonBar: css({ h: '8', bg: 'muted', rounded: 'md' }),
  mutedText: css({ fontSize: 'sm', color: 'fg.muted' }),
  statHeader: css({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'sm' }),
  statLabel: css({ display: 'flex', alignItems: 'center', gap: '2' }),
  statValues: css({ display: 'flex', alignItems: 'center', gap: '2', color: 'fg.muted' }),
  fontMedium: css({ fontWeight: 'medium' }),
  progressBar: css({ h: '2', w: 'full', bg: 'muted', rounded: 'full', overflow: 'hidden' }),
}

