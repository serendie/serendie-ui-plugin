import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
import * as esbuild from 'esbuild'

const isWatch = process.argv.includes('--watch')

const buildOptions = {
  entryPoints: ['ui-src/index.tsx'],
  bundle: true,
  outfile: 'dist/ui.js',
  target: 'es2020',
  format: 'iife',
  loader: { '.tsx': 'tsx' },
  define: {
    'process.env.DOCS_SEARCH_API_KEY': JSON.stringify(
      process.env.DOCS_SEARCH_API_KEY || ''
    ),
  },
}

if (isWatch) {
  const ctx = await esbuild.context(buildOptions)
  await ctx.watch()
  console.log('Watching for changes...')
} else {
  await esbuild.build(buildOptions)
}
