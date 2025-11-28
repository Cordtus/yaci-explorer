import postcss from 'postcss'
import postcssLoadConfig from 'postcss-load-config'

const isProd = process.env.NODE_ENV === 'production'

// Build JS bundle
const result = await Bun.build({
	entrypoints: ['./src/main.tsx'],
	outdir: './dist',
	target: 'browser',
	format: 'esm',
	splitting: true,
	sourcemap: isProd ? 'external' : 'inline',
	minify: isProd,
	naming: {
		entry: '[dir]/[name].[ext]',
		chunk: '[dir]/[name]-[hash].[ext]',
		asset: '[dir]/[name].[ext]',
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

console.log(`Built ${result.outputs.length} JS files`)

// Process CSS
const css = await Bun.file('./src/index.css').text()
const { plugins, options } = await postcssLoadConfig()
const cssResult = await postcss(plugins).process(css, { ...options, from: './src/index.css', to: './dist/styles.css' })
await Bun.write('./dist/styles.css', cssResult.css)
console.log('Built styles.css')

// Copy index.html
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
console.log('Built index.html')

console.log('Build complete')
