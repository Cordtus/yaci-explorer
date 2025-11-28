import type { MiddlewareFunction } from "react-router"

export const loggingMiddleware: MiddlewareFunction = async (
	{ request },
	next
) => {
	const url = new URL(request.url)
	console.log(`Starting navigation: ${url.pathname}${url.search}`)
	const start = performance.now()
	await next()
	const duration = performance.now() - start
	console.log(`Navigation completed in ${duration}ms`)
}
