import { readdirSync, copyFileSync, mkdirSync, existsSync, rmSync } from 'fs'
import { join, basename } from 'path'
import postcss from 'postcss'
import autoprefixer from 'autoprefixer'
import pandacss from '@pandacss/dev/postcss'

const isProd = process.env.NODE_ENV === 'production'

// Clean dist directory
if (existsSync('./dist')) {
	rmSync('./dist', { recursive: true })
}
mkdirSync('./dist', { recursive: true })

// Build JS bundle with content hashes for cache busting
const result = await Bun.build({
	entrypoints: ['./src/main.tsx'],
	outdir: './dist',
	target: 'browser',
	format: 'esm',
	splitting: false,
	sourcemap: isProd ? 'external' : 'inline',
	minify: isProd,
	publicPath: '/',
	naming: {
		entry: '[dir]/[name]-[hash].[ext]',
		chunk: '[dir]/[name]-[hash].[ext]',
		asset: '[dir]/[name]-[hash].[ext]',
	},
	define: {
		'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),
	},
})

if (!result.success) {
	console.error('Build failed:')
	for (const log of result.logs) {
		console.error(log)
	}
	process.exit(1)
}

const entryOutput = result.outputs.find(o => o.kind === 'entry-point')
const entryFilename = entryOutput ? basename(entryOutput.path) : 'main.js'
console.log(`Built ${result.outputs.length} JS files (entry: ${entryFilename})`)

// Process CSS with content hash
const css = await Bun.file('./src/index.css').text()
const cssResult = await postcss([pandacss, autoprefixer]).process(css, { from: './src/index.css', to: './dist/styles.css' })
const cssHash = new Bun.CryptoHasher('md5').update(cssResult.css).digest('hex').slice(0, 8)
const cssFilename = `styles-${cssHash}.css`
await Bun.write(`./dist/${cssFilename}`, cssResult.css)
console.log(`Built ${cssFilename}`)

// Copy public assets to dist
const publicDir = './public'
if (existsSync(publicDir)) {
	for (const file of readdirSync(publicDir)) {
		const src = join(publicDir, file)
		const dest = join('./dist', file)
		copyFileSync(src, dest)
	}
	console.log('Copied public assets')
}

// Generate index.html referencing hashed filenames
const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Yaci Explorer</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="stylesheet" href="/${cssFilename}" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/${entryFilename}"></script>
  </body>
</html>`
await Bun.write('./dist/index.html', html)
console.log('Built index.html')
console.log('Build complete')
