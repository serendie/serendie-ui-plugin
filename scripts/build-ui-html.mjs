import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Ensure dist directory exists
const distDir = path.join(__dirname, '..', 'dist')
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true })
}

// Read the HTML template
let uiText = fs.readFileSync(path.join(__dirname, '..', 'ui-src', 'template.html'), 'utf8')

// Read the bundled JavaScript
const jsPath = path.join(distDir, 'ui.js')
const jsContent = fs.readFileSync(jsPath, 'utf8')

// Read Serendie UI styles
let serendieStyles = ''
try {
  const serendieCssPath = path.join(
    __dirname,
    '..',
    'node_modules',
    '@serendie',
    'ui',
    'dist',
    'styles.css'
  )
  if (fs.existsSync(serendieCssPath)) {
    serendieStyles = fs.readFileSync(serendieCssPath, 'utf8')
  } else {
    console.warn('⚠️  Serendie UI styles not found')
  }
} catch (error) {
  console.warn('⚠️  Could not load Serendie UI styles:', error.message)
}

// Replace placeholders in template
// Use split/join to avoid replacement pattern issues ($&, $1, etc.)
const html = uiText
  .split('/* SERENDIE_STYLES_PLACEHOLDER */')
  .join(serendieStyles)
  .split('<!-- UI_SCRIPT -->')
  .join(jsContent)

// Write HTML file
fs.writeFileSync(path.join(distDir, 'ui.html'), html)
console.log('✅ Built ui.html')
