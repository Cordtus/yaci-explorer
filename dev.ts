import { watch } from 'fs'
import { join, extname } from 'path'
import { homedir } from 'os'
import postcss from 'postcss'
import postcssLoadConfig from 'postcss-load-config'

const PORT = parseInt(process.env.PORT || '5173')
const BUN_PATH = join(homedir(), '.bun/bin/bun')

// MIME types
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
	'.eot': 'application/vnd.ms-fontobject',
}

// Build the app
async function build() {
	const result = await Bun.build({
		entrypoints: ['./src/main.tsx'],
		outdir: './dist',
		target: 'browser',
		format: 'esm',
		splitting: true,
		sourcemap: 'inline',
		minify: false,
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

// Process CSS with PostCSS programmatically
async function processCSS() {
	try {
		const css = await Bun.file('./src/index.css').text()
		const { plugins, options } = await postcssLoadConfig()
		const result = await postcss(plugins).process(css, { ...options, from: './src/index.css', to: './dist/styles.css' })
		await Bun.write('./dist/styles.css', result.css)
		return true
	} catch (e) {
		console.error('CSS processing failed:', e)
		return false
	}
}

// Generate index.html with correct script paths
async function generateHTML() {
	const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Republic AI Block Explorer</title>
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

// Watch for changes
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

watch('./src', { recursive: true }, (event, filename) => {
	if (filename && !filename.includes('node_modules')) {
		scheduleRebuild()
	}
})

watch('./styled-system', { recursive: true }, (event, filename) => {
	if (filename) {
		scheduleRebuild()
	}
})

// Serve files
const server = Bun.serve({
	port: PORT,
	async fetch(req) {
		const url = new URL(req.url)
		let pathname = url.pathname

		// Handle SPA routing - serve index.html for non-file paths
		if (!pathname.includes('.')) {
			pathname = '/index.html'
		}

		const filePath = join('./dist', pathname)

		try {
			const file = Bun.file(filePath)
			const exists = await file.exists()

			if (!exists) {
				// Fallback to index.html for SPA
				const indexFile = Bun.file('./dist/index.html')
				return new Response(indexFile, {
					headers: { 'Content-Type': 'text/html' },
				})
			}

			const ext = extname(pathname)
			const contentType = mimeTypes[ext] || 'application/octet-stream'

			return new Response(file, {
				headers: { 'Content-Type': contentType },
			})
		} catch (e) {
			return new Response('Not found', { status: 404 })
		}
	},
})

console.log(`Dev server running at http://localhost:${PORT}`)
