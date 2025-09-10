import { defineConfig } from '@pandacss/dev'
import { SerendiePreset } from '@serendie/ui'

export default defineConfig({
  preflight: true,
  presets: [SerendiePreset],
  include: ['./ui-src/**/*.{ts,tsx}'],
  exclude: [],
  theme: {
    extend: {},
  },
  jsxFramework: 'react',
  outdir: 'styled-system',
})
