import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { api } from '@/lib/api'
import { css } from '@/styled-system/css'

interface MessageTypeStats {
  type: string
  count: number
  percentage: number
  trend?: 'up' | 'down' | 'stable'
}

async function getTopMessageTypes(): Promise<MessageTypeStats[]> {
  // Use the api's getTransactionTypeDistribution method
  const typeData = await api.getTransactionTypeDistribution()

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
          <CardTitle className={styles.titleFlex}>
            <BarChart3 className={styles.icon} />
            Top Message Types
          </CardTitle>
          <CardDescription>Most frequently used message types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={styles.spaceY2}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className={styles.animatePulse}>
                <div className={styles.skeletonBar}></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const maxCount = Math.max(...data.map(d => d.count))

  const getColorStyle = (index: number) => {
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
      'cyan.500'
    ]
    return colors[index % colors.length]
  }

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className={css({ h: '3', w: '3', color: 'green.500' })} />
      case 'down':
        return <TrendingDown className={css({ h: '3', w: '3', color: 'red.500' })} />
      default:
        return <Minus className={css({ h: '3', w: '3', color: 'fg.muted' })} />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className={styles.titleFlex}>
          <BarChart3 className={styles.icon} />
          Top Message Types
        </CardTitle>
        <CardDescription>
          Distribution of the most frequently used message types
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className={styles.spaceY4}>
          {data.map((stat, index) => (
            <div key={stat.type} className={styles.spaceY2}>
              <div className={styles.statRow}>
                <div className={styles.statLeft}>
                  <span className={styles.indexLabel}>
                    #{index + 1}
                  </span>
                  <span className={styles.typeLabel} title={stat.type}>
                    {stat.type}
                  </span>
                  {getTrendIcon(stat.trend)}
                </div>
                <div className={styles.statRight}>
                  <span className={styles.percentage}>
                    {stat.percentage.toFixed(1)}%
                  </span>
                  <span className={styles.count}>
                    {stat.count.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className={styles.barContainer}>
                <div
                  className={css({ position: 'absolute', insetY: '0', left: '0', bg: getColorStyle(index), opacity: '0.8', transition: 'all', transitionDuration: '500ms' })}
                  style={{ width: `${(stat.count / maxCount) * 100}%` }}
                />
                <div className={styles.barLabel}>
                  <span className={styles.barText}>
                    {stat.count > 1000 ? `${(stat.count / 1000).toFixed(1)}k` : stat.count}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.summary}>
          <div className={styles.summaryGrid}>
            <div>
              <span className={styles.summaryLabel}>Total Messages:</span>
              <span className={styles.summaryValue}>
                {data.reduce((sum, d) => sum + d.count, 0).toLocaleString()}
              </span>
            </div>
            <div>
              <span className={styles.summaryLabel}>Unique Types:</span>
              <span className={styles.summaryValue}>{data.length}</span>
            </div>
          </div>
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
  statRow: css({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'sm' }),
  statLeft: css({ display: 'flex', alignItems: 'center', gap: '2' }),
  indexLabel: css({ fontFamily: 'mono', fontSize: 'xs', color: 'fg.muted' }),
  typeLabel: css({ fontWeight: 'medium', truncate: true, maxW: '200px' }),
  statRight: css({ display: 'flex', alignItems: 'center', gap: '3', fontSize: 'sm' }),
  percentage: css({ color: 'fg.muted' }),
  count: css({ fontFamily: 'mono', fontWeight: 'medium' }),
  barContainer: css({ position: 'relative', h: '6', bg: 'muted', rounded: 'md', overflow: 'hidden' }),
  barLabel: css({ position: 'absolute', inset: '0', display: 'flex', alignItems: 'center', px: '2' }),
  barText: css({ fontSize: 'xs', fontWeight: 'medium', color: 'white', mixBlendMode: 'difference' }),
  summary: css({ mt: '4', pt: '4', borderTopWidth: '1px' }),
  summaryGrid: css({ display: 'grid', gridTemplateColumns: '2', gap: '4', fontSize: 'sm' }),
  summaryLabel: css({ color: 'fg.muted' }),
  summaryValue: css({ ml: '2', fontWeight: 'medium' }),
}
