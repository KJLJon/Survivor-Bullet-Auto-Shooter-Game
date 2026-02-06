/**
 * generate-icons.js
 *
 * Generates PNG icon files for the PWA manifest using Node.js canvas.
 *
 * Prerequisites:
 *   npm install canvas
 *
 * Usage:
 *   node scripts/generate-icons.js
 *
 * Output:
 *   public/icons/icon-192.png  (192x192)
 *   public/icons/icon-512.png  (512x512)
 */

const fs = require('fs');
const path = require('path');

let createCanvas;
try {
  createCanvas = require('canvas').createCanvas;
} catch {
  console.log('='.repeat(60));
  console.log('The "canvas" npm package is not installed.');
  console.log('');
  console.log('To generate PNG icons, run:');
  console.log('  npm install canvas');
  console.log('  node scripts/generate-icons.js');
  console.log('');
  console.log('Alternatively, SVG icons are already available at:');
  console.log('  public/icons/icon-192.svg');
  console.log('  public/icons/icon-512.svg');
  console.log('='.repeat(60));
  process.exit(0);
}

const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;
  const scale = size / 512;

  // ---- Background rounded rectangle ----
  const radius = 80 * scale;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();

  // Dark gradient fill
  const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx);
  bgGrad.addColorStop(0, '#2a1a3e');
  bgGrad.addColorStop(1, '#0d0d1a');
  ctx.fillStyle = bgGrad;
  ctx.fill();
  ctx.clip(); // clip everything to rounded rect

  // ---- Red glow ----
  const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 180 * scale);
  glowGrad.addColorStop(0, 'rgba(255, 51, 68, 0.3)');
  glowGrad.addColorStop(1, 'rgba(255, 51, 68, 0)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, size, size);

  // ---- Outer ring ----
  ctx.beginPath();
  ctx.arc(cx, cy, 150 * scale, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 51, 68, 0.6)';
  ctx.lineWidth = 6 * scale;
  ctx.stroke();

  // ---- Dashed middle ring ----
  ctx.beginPath();
  ctx.arc(cx, cy, 100 * scale, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 51, 68, 0.4)';
  ctx.lineWidth = 4 * scale;
  ctx.setLineDash([12 * scale, 8 * scale]);
  ctx.stroke();
  ctx.setLineDash([]);

  // ---- Inner ring ----
  ctx.beginPath();
  ctx.arc(cx, cy, 55 * scale, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 51, 68, 0.8)';
  ctx.lineWidth = 4 * scale;
  ctx.stroke();

  // ---- Crosshair lines ----
  ctx.strokeStyle = '#ff4455';
  ctx.lineWidth = 6 * scale;
  ctx.lineCap = 'round';

  // Top
  drawLine(ctx, cx, 60 * scale, cx, (cy - 55 * scale));
  // Bottom
  drawLine(ctx, cx, (cy + 55 * scale), cx, (size - 60 * scale));
  // Left
  drawLine(ctx, 60 * scale, cy, (cx - 55 * scale), cy);
  // Right
  drawLine(ctx, (cx + 55 * scale), cy, (size - 60 * scale), cy);

  // ---- Center dot ----
  ctx.beginPath();
  ctx.arc(cx, cy, 10 * scale, 0, Math.PI * 2);
  ctx.fillStyle = '#ff3344';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, 4 * scale, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fill();

  // ---- Scattered bullet projectiles ----
  const bullets = [
    { x: 150, y: 120, r: 8, color: '#ffaa33', a: 0.7 },
    { x: 380, y: 130, r: 7, color: '#ff5566', a: 0.6 },
    { x: 110, y: 340, r: 9, color: '#ffaa33', a: 0.5 },
    { x: 400, y: 360, r: 8, color: '#ff5566', a: 0.6 },
    { x: 360, y: 100, r: 5, color: '#ffcc44', a: 0.5 },
    { x: 130, y: 380, r: 5, color: '#ffcc44', a: 0.4 },
    { x: 420, y: 200, r: 6, color: '#ff7788', a: 0.5 },
    { x: 90,  y: 200, r: 6, color: '#ff7788', a: 0.4 },
  ];

  for (const b of bullets) {
    ctx.globalAlpha = b.a;
    ctx.beginPath();
    ctx.arc(b.x * scale, b.y * scale, b.r * scale, 0, Math.PI * 2);
    ctx.fillStyle = b.color;
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // ---- Title text (only for 512 size) ----
  if (size >= 512) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    ctx.font = `bold ${42 * scale}px Arial, Helvetica, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.letterSpacing = `${2 * scale}px`;
    ctx.fillText('SURVIVORS', cx, 475 * scale);

    ctx.font = `${16 * scale}px Arial, Helvetica, sans-serif`;
    ctx.fillStyle = 'rgba(255, 68, 85, 0.8)';
    ctx.fillText('BULLET HELL', cx, 500 * scale);
  }

  return canvas;
}

function drawLine(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

// Generate both sizes
for (const size of [192, 512]) {
  const canvas = drawIcon(size);
  const buffer = canvas.toBuffer('image/png');
  const outPath = path.join(ICONS_DIR, `icon-${size}.png`);
  fs.writeFileSync(outPath, buffer);
  console.log(`Created ${outPath} (${buffer.length} bytes)`);
}

console.log('\nDone! PNG icons generated successfully.');
