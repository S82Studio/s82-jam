const sharp = require('D:/Github/zenithstudio/node_modules/sharp');
const S = 1024;
const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">
 <defs>
  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#26222b"/><stop offset="1" stop-color="#0c0b0f"/></linearGradient>
  <radialGradient id="glow" cx="0.5" cy="0.45" r="0.5"><stop offset="0" stop-color="#f7a8c8" stop-opacity="0.22"/><stop offset="1" stop-color="#f7a8c8" stop-opacity="0"/></radialGradient>
 </defs>
 <rect x="100" y="100" width="824" height="824" rx="185" fill="url(#g)"/>
 <rect x="100" y="100" width="824" height="824" rx="185" fill="url(#glow)"/>
 <rect x="101.5" y="101.5" width="821" height="821" rx="184" fill="none" stroke="#ffffff" stroke-opacity="0.08" stroke-width="3"/>
 <g fill="none" stroke="#f4a3c4" stroke-linecap="round">
  <path d="M 262 330 A 240 240 0 0 0 262 640" stroke-width="16" stroke-opacity="0.55"/>
  <path d="M 205 285 A 310 310 0 0 0 205 685" stroke-width="12" stroke-opacity="0.30"/>
  <path d="M 762 330 A 240 240 0 0 1 762 640" stroke-width="16" stroke-opacity="0.55"/>
  <path d="M 819 285 A 310 310 0 0 1 819 685" stroke-width="12" stroke-opacity="0.30"/>
 </g>
 <text x="512" y="868" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-weight="700" font-size="92" letter-spacing="22" fill="#f6b3cf">JAM</text>
</svg>`;
(async () => {
  // crop the 8 + blossoms (drop "STUDIO"), scale up
  const mark = await sharp('D:/Github/zenithstudio/public/icon-512.png')
    .extract({ left: 40, top: 70, width: 432, height: 432 }).resize(600, 600, { kernel: 'lanczos3' }).png().toBuffer();
  const base = await sharp(Buffer.from(bg)).png().toBuffer();
  const out = await sharp(base).composite([{ input: mark, left: 212, top: 150, blend: 'screen' }]).png().toBuffer();
  // clip to the rounded square so screen-blend black never leaks outside
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}"><rect x="100" y="100" width="824" height="824" rx="185" fill="#fff"/></svg>`);
  const fin = await sharp(out).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  await sharp(fin).toFile('icon_1024.png');
  await sharp(fin).resize(256, 256).toFile('icon_256.png');
  // tight square for title (no padding)
  await sharp(fin).extract({ left: 100, top: 100, width: 824, height: 824 }).resize(96, 96).toFile('logo_96.png');
  await sharp(fin).extract({ left: 100, top: 100, width: 824, height: 824 }).resize(1024, 1024).toFile('logo_1024.png');
  console.log('ok');
})();
