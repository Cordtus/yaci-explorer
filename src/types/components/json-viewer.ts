export interface JsonViewerProps {
  data: any
  maxHeight?: number
  className?: string
}

export interface JsonNodeProps {
  data: any
  name?: string
  level?: number
  isLast?: boolean
}
