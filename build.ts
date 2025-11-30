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

// Copy index.html from source
const html = await Bun.file('./index.html').text()
await Bun.write('./dist/index.html', html)
console.log('Built index.html')

// Copy public assets
const favicon = await Bun.file('./public/favicon.svg').text()
await Bun.write('./dist/favicon.svg', favicon)
console.log('Copied favicon.svg')

console.log('Build complete')
