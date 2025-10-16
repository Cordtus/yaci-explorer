/**
 * Interactive JSON viewer with collapsible nested structures
 * @param data - JSON data to display
 * @param maxHeight - Maximum height in pixels for the scrollable container
 */

import { useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

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
      <div className="flex gap-2 py-0.5" style={{ paddingLeft: `${indent}px` }}>
        {name && <span className="text-blue-600 dark:text-blue-400">{name}:</span>}
        <span className={cn(
          typeof data === 'string' && 'text-green-600 dark:text-green-400',
          typeof data === 'number' && 'text-purple-600 dark:text-purple-400',
          typeof data === 'boolean' && 'text-orange-600 dark:text-orange-400',
          data === null && 'text-gray-500 dark:text-gray-400'
        )}>
          {typeof data === 'string' ? `"${data}"` : String(data)}
        </span>
      </div>
    )
  }

  // Object/Array rendering
  const entries = isArray ? data : Object.entries(data)
  const itemCount = isArray ? data.length : Object.keys(data).length
  const preview = isArray ? `[${itemCount}]` : `{${itemCount}}`

  return (
    <div>
      <div
        className="flex gap-2 py-0.5 cursor-pointer hover:bg-muted/50 rounded"
        style={{ paddingLeft: `${indent}px` }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        )}
        {name && <span className="text-blue-600 dark:text-blue-400">{name}:</span>}
        <span className="text-gray-600 dark:text-gray-400">
          {isArray ? '[' : '{'}
          {!isExpanded && <span className="text-xs text-muted-foreground ml-1">{preview}</span>}
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
            className="text-gray-600 dark:text-gray-400 py-0.5"
            style={{ paddingLeft: `${indent}px` }}
          >
            {isArray ? ']' : '}'}
          </div>
        </>
      )}

      {!isExpanded && (
        <div
          className="text-gray-600 dark:text-gray-400 py-0.5"
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
          className={cn(
            'bg-muted/30 rounded-md p-3 overflow-auto font-mono text-xs',
            className
          )}
          style={{ maxHeight: `${maxHeight}px` }}
        >
          <pre className="whitespace-pre-wrap break-words">{data}</pre>
        </div>
      )
    }
  }

  return (
    <div
      className={cn(
        'bg-muted/30 rounded-md p-3 overflow-auto font-mono text-xs',
        className
      )}
      style={{ maxHeight: `${maxHeight}px` }}
    >
      <JsonNode data={parsedData} />
    </div>
  )
}
