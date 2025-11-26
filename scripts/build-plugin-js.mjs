import * as esbuild from 'esbuild'

const isWatch = process.argv.includes('--watch')

const buildOptions = {
  entryPoints: ['plugin-src/code.ts'],
  bundle: true,
  outfile: 'dist/plugin.js',
  target: 'es2017',
  format: 'iife',
  external: ['figma'],
}

if (isWatch) {
  const ctx = await esbuild.context(buildOptions)
  await ctx.watch()
  console.log('Watching for changes...')
} else {
  await esbuild.build(buildOptions)
}
