import { watch } from 'fs'
import { join, extname } from 'path'
import postcss from 'postcss'
import autoprefixer from 'autoprefixer'
import pandacss from '@pandacss/dev/postcss'

const PORT = parseInt(process.env.PORT || '5173')

const mimeTypes: Record<string, string> = {
	'.html': 'text/html',
	'.js': 'text/javascript',
	'.mjs': 'text/javascript',
	'.css': 'text/css',
	'.json': 'application/json',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.svg': 'image/svg+xml',
	'.ico': 'image/x-icon',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
	'.ttf': 'font/ttf',
}

async function build() {
	const result = await Bun.build({
		entrypoints: ['./src/main.tsx'],
		outdir: './dist',
		target: 'browser',
		format: 'esm',
		splitting: false,
		sourcemap: 'inline',
		minify: false,
		publicPath: '/',
		naming: {
			entry: '[dir]/[name].[ext]',
			chunk: '[dir]/[name]-[hash].[ext]',
			asset: '[dir]/[name].[ext]',
		},
		define: {
			'process.env.NODE_ENV': JSON.stringify('development'),
		},
	})

	if (!result.success) {
		console.error('Build failed:')
		for (const log of result.logs) {
			console.error(log)
		}
		return false
	}
	return true
}

async function processCSS() {
	try {
		const css = await Bun.file('./src/index.css').text()
		const result = await postcss([pandacss, autoprefixer]).process(css, { from: './src/index.css', to: './dist/styles.css' })
		await Bun.write('./dist/styles.css', result.css)
		return true
	} catch (e) {
		console.error('CSS processing failed:', e)
		return false
	}
}

async function generateHTML() {
	const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Yaci Explorer</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.js"></script>
  </body>
</html>`
	await Bun.write('./dist/index.html', html)
}

// Initial build
console.log('Building...')
const cssOk = await processCSS()
const buildOk = await build()
await generateHTML()

if (!cssOk || !buildOk) {
	console.error('Initial build failed')
	process.exit(1)
}

console.log('Initial build complete')

// Watch for changes with debounce
let debounceTimer: Timer | null = null

function scheduleRebuild() {
	if (debounceTimer) clearTimeout(debounceTimer)
	debounceTimer = setTimeout(async () => {
		console.log('Rebuilding...')
		await processCSS()
		await build()
		console.log('Rebuild complete')
	}, 100)
}

watch('./src', { recursive: true }, (_event, filename) => {
	if (filename && !filename.includes('node_modules')) {
		scheduleRebuild()
	}
})

watch('./styled-system', { recursive: true }, (_event, _filename) => {
	scheduleRebuild()
})

// Dev server with SPA fallback
const server = Bun.serve({
	port: PORT,
	async fetch(req) {
		const url = new URL(req.url)
		let pathname = url.pathname

		// Serve node_modules for dynamic imports
		if (pathname.startsWith('/node_modules/')) {
			const filePath = join('.', pathname)
			try {
				const file = Bun.file(filePath)
				if (await file.exists()) {
					const ext = extname(pathname)
					return new Response(file, {
						headers: { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' },
					})
				}
			} catch {
				// fall through to 404
			}
			return new Response('Not found', { status: 404 })
		}

		// SPA routing: non-file paths serve index.html
		if (!pathname.includes('.')) {
			pathname = '/index.html'
		}

		const filePath = join('./dist', pathname)

		try {
			const file = Bun.file(filePath)
			if (await file.exists()) {
				const ext = extname(pathname)
				return new Response(file, {
					headers: { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' },
				})
			}
		} catch {
			// fall through to SPA fallback
		}

		// SPA fallback
		const indexFile = Bun.file('./dist/index.html')
		return new Response(indexFile, {
			headers: { 'Content-Type': 'text/html' },
		})
	},
})

console.log(`Dev server running at http://localhost:${PORT}`)
