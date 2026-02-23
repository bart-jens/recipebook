// Run: node generate-icons.js
// Requires: npm install sharp (then npm uninstall sharp when done)

const sharp = require('sharp');

const BG = '#F6F4EF';   // cream
const INK = '#141210';  // near-black
const CREAM = '#F6F4EF';

function forkSvg({ padding = 1, bgColor = BG, forkColor = INK } = {}) {
  const size = 24 + padding * 2;
  const ox = -padding;
  const oy = -padding;
  const hasBg = bgColor !== 'transparent';
  return `<svg width="1024" height="1024" viewBox="${ox} ${oy} ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  ${hasBg ? `<rect x="${ox}" y="${oy}" width="${size}" height="${size}" fill="${bgColor}"/>` : ''}
  <defs>
    <mask id="m">
      <rect x="-100" y="-100" width="500" height="500" fill="white"/>
      <line x1="8.5"  y1="5"    x2="8.5"  y2="10.5" stroke="black" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="10.8" y1="5"    x2="10.8" y2="10.5" stroke="black" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="13.2" y1="5"    x2="13.2" y2="10.5" stroke="black" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="15.5" y1="5"    x2="15.5" y2="10.5" stroke="black" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M8.5 10.5 Q8.5 13 12 13 Q15.5 13 15.5 10.5" stroke="black" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <line x1="12"   y1="13"   x2="12"   y2="19.5" stroke="black" stroke-width="1.8" stroke-linecap="round"/>
    </mask>
  </defs>
  <circle cx="12" cy="12" r="11" fill="${forkColor}" mask="url(#m)"/>
</svg>`;
}

async function generate() {
  // icon.png — cream bg, black fork, tight padding
  await sharp(Buffer.from(forkSvg({ padding: 1 })))
    .png()
    .toFile('assets/images/icon.png');
  console.log('✓ icon.png (1024x1024, cream bg, black fork)');

  // adaptive-icon.png — transparent bg, cream fork (sits on brown bg from app.json)
  await sharp(Buffer.from(forkSvg({ padding: 5, bgColor: 'transparent', forkColor: CREAM })))
    .png()
    .toFile('assets/images/adaptive-icon.png');
  console.log('✓ adaptive-icon.png (1024x1024, transparent bg, cream fork)');

  // splash-icon.png — cream bg, black fork, more padding for splash screen
  await sharp(Buffer.from(forkSvg({ padding: 6 })))
    .png()
    .toFile('assets/images/splash-icon.png');
  console.log('✓ splash-icon.png (1024x1024, cream bg, extra padding)');
}

generate().catch(console.error);
