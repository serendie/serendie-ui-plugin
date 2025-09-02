#!/usr/bin/env node

const https = require('https')
const fs = require('fs')
const path = require('path')

const pages = [
  '/foundations/02_00_color_palette.mdx',
  '/foundations/02_01_color_role.mdx',
]

async function fetch(url, destPath) {
  const dir = path.dirname(destPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath)
    https
      .get(url, response => {
        response.pipe(file)
        file.on('finish', () => {
          file.close()
          console.log(`Downloaded: ${destPath}`)
          resolve()
        })
      })
      .on('error', reject)
  })
}

async function main() {
  const files = pages.map(page => ({
    url: `https://raw.githubusercontent.com/serendie/serendie-web/dev/src/content/pages${page}`,
    dest: `./widget-src/assets/serendie-web${page}`,
  }))
  for (const file of files) {
    try {
      await fetch(file.url, file.dest)
    } catch (error) {
      console.error(`Failed to download ${file.url}:`, error)
    }
  }
}

main()
