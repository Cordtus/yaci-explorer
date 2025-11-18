/// <reference types="vite/client" />

declare module '*.css?url' {
  const value: string
  export default value
}
