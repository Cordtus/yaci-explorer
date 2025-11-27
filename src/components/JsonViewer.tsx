/**
 * Interactive JSON viewer with collapsible nested structures
 * @param data - JSON data to display
 * @param maxHeight - Maximum height in pixels for the scrollable container
 */

import { useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { css, cx } from '@/styled-system/css'

interface JsonViewerProps {
  data: any
  maxHeight?: number
  className?: string
}

interface JsonNodeProps {
  data: any
  name?: string
  level?: number
  isLast?: boolean
}

function JsonNode({ data, name, level = 0, isLast = true }: JsonNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2) // Auto-expand first 2 levels

  const indent = level * 16
  const isObject = data !== null && typeof data === 'object'
  const isArray = Array.isArray(data)

  // Check if string value is nested JSON
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data)
      if (typeof parsed === 'object' && parsed !== null) {
        // This is a nested JSON string, render it as an object
        return <JsonNode data={parsed} name={name} level={level} isLast={isLast} />
      }
    } catch {
      // Not JSON, render as string
    }
  }

  // Primitive value rendering
  if (!isObject) {
    return (
      <div className={css({ display: 'flex', gap: '2', py: '0.5' })} style={{ paddingLeft: `${indent}px` }}>
        {name && <span className={css({ color: 'blue.600', _dark: { color: 'blue.400' } })}>{name}:</span>}
        <span className={cx(
          typeof data === 'string' && css({ color: 'green.600', _dark: { color: 'green.400' } }),
          typeof data === 'number' && css({ color: 'purple.600', _dark: { color: 'purple.400' } }),
          typeof data === 'boolean' && css({ color: 'orange.600', _dark: { color: 'orange.400' } }),
          data === null && css({ color: 'gray.500', _dark: { color: 'gray.400' } })
        )}>
          {typeof data === 'string' ? `"${data}"` : String(data)}
        </span>
      </div>
    )
  }

  // Object/Array rendering
  const itemCount = isArray ? data.length : Object.keys(data).length
  const preview = isArray ? `[${itemCount}]` : `{${itemCount}}`

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setIsExpanded(!isExpanded)
    }
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        className={css({
          display: 'flex',
          gap: '2',
          py: '0.5',
          cursor: 'pointer',
          rounded: 'md',
          _hover: { bg: 'bg.muted/50' }
        })}
        style={{ paddingLeft: `${indent}px` }}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={handleKeyDown}
      >
        {isExpanded ? (
          <ChevronDown className={css({ h: '4', w: '4', color: 'fg.muted', flexShrink: '0', mt: '0.5' })} />
        ) : (
          <ChevronRight className={css({ h: '4', w: '4', color: 'fg.muted', flexShrink: '0', mt: '0.5' })} />
        )}
        {name && <span className={css({ color: 'blue.600', _dark: { color: 'blue.400' } })}>{name}:</span>}
        <span className={css({ color: 'gray.600', _dark: { color: 'gray.400' } })}>
          {isArray ? '[' : '{'}
          {!isExpanded && <span className={css({ fontSize: 'xs', color: 'fg.muted', ml: '1' })}>{preview}</span>}
        </span>
      </div>

      {isExpanded && (
        <>
          {isArray ? (
            data.map((item: any, idx: number) => (
              <JsonNode
                key={idx}
                data={item}
                name={String(idx)}
                level={level + 1}
                isLast={idx === data.length - 1}
              />
            ))
          ) : (
            Object.entries(data).map(([key, value], idx) => (
              <JsonNode
                key={key}
                data={value}
                name={key}
                level={level + 1}
                isLast={idx === Object.keys(data).length - 1}
              />
            ))
          )}
          <div
            className={css({ color: 'gray.600', _dark: { color: 'gray.400' }, py: '0.5' })}
            style={{ paddingLeft: `${indent}px` }}
          >
            {isArray ? ']' : '}'}
          </div>
        </>
      )}

      {!isExpanded && (
        <div
          className={css({ color: 'gray.600', _dark: { color: 'gray.400' }, py: '0.5' })}
          style={{ paddingLeft: `${indent}px` }}
        >
          {isArray ? ']' : '}'}
        </div>
      )}
    </div>
  )
}

export function JsonViewer({ data, maxHeight = 300, className }: JsonViewerProps) {
  // Try to parse if data is a string
  let parsedData = data
  if (typeof data === 'string') {
    try {
      parsedData = JSON.parse(data)
    } catch {
      // If parsing fails, display as plain text
      return (
        <div
          className={cx(
            css({
              bg: 'bg.muted/30',
              rounded: 'md',
              p: '3',
              overflow: 'auto',
              fontFamily: 'mono',
              fontSize: 'xs'
            }),
            className
          )}
          style={{ maxHeight: `${maxHeight}px` }}
        >
          <pre className={css({ whiteSpace: 'pre-wrap', wordBreak: 'break-word' })}>{data}</pre>
        </div>
      )
    }
  }

  return (
    <div
      className={cx(
        css({
          bg: 'bg.muted/30',
          rounded: 'md',
          p: '3',
          overflow: 'auto',
          fontFamily: 'mono',
          fontSize: 'xs'
        }),
        className
      )}
      style={{ maxHeight: `${maxHeight}px` }}
    >
      <JsonNode data={parsedData} />
    </div>
  )
}
