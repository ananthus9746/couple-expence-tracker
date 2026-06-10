// Run: node public/icons/generate-icons.mjs
// Generates placeholder PNG icons for PWA manifest
// In production, replace with proper designed icons

import { createCanvas } from 'canvas'
import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const sizes = [192, 512]

for (const size of sizes) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Background
  const grad = ctx.createLinearGradient(0, 0, size, size)
  grad.addColorStop(0, '#7c3aed')
  grad.addColorStop(1, '#d2bbff')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.roundRect(0, 0, size, size, size * 0.2)
  ctx.fill()

  // Text
  ctx.fillStyle = '#ede0ff'
  ctx.font = `bold ${size * 0.4}px serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('⚔️', size / 2, size / 2)

  writeFileSync(join(__dirname, `icon-${size}x${size}.png`), canvas.toBuffer('image/png'))
  console.log(`Generated icon-${size}x${size}.png`)
}
