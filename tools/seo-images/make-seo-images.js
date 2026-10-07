// Generates the committed SEO images: the 1200x630 OG share card, the icon set
// (apple-touch-icon, icon-192, icon-512), src/favicon.ico and the JSON-LD logo.
// The outputs are committed as plain files, so `npm run build` and `npm test` never
// need an image library. Rerun only when the artwork (logo.png / hero-bg.jpg) changes.
// Usage: npm --prefix tools/seo-images ci, then node tools/seo-images/make-seo-images.js
// Cache rule: Discord and Facebook cache share images by URL. When the OG card changes
// after a deploy, write it under a new name (og-default-v2.jpg) and update `ogImage`
// in src/_data/site.js so the previews are fetched again.
// Reads two fixed inputs, writes only the six fixed outputs below. No network access.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const repoRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));

const inputs = {
  logo: join(repoRoot, "src/assets/logo.png"),
  hero: join(repoRoot, "src/assets/hero-bg.jpg"),
};

const outputs = {
  og: join(repoRoot, "src/assets/og/og-default-v1.jpg"),
  appleTouch: join(repoRoot, "src/assets/icons/apple-touch-icon.png"),
  icon192: join(repoRoot, "src/assets/icons/icon-192.png"),
  icon512: join(repoRoot, "src/assets/icons/icon-512.png"),
  brandLogo: join(repoRoot, "src/assets/brand/ibc-logo-512.png"),
  favicon: join(repoRoot, "src/favicon.ico"),
};

// Colours from src/css/style.css :root.
const bgColor = "#080e11"; // --bg-primary
const accentColor = "#cbb18a"; // --accent-color
const creamColor = "#e8ded0"; // --text-primary
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };

const ogWidth = 1200;
const ogHeight = 630;
const ogMaxBytes = 307200; // 300 KB
const fontStack = "Montserrat, 'Segoe UI', Arial, sans-serif";

// OG layout: the rose on the left, vertically centred; text to its right.
const logoBox = { left: 90, top: 165, size: 300 };
const textLeft = 440;
const safeArea = { right: 1140, top: 40, bottom: 590, minX: logoBox.left + logoBox.size + 20 };

function fail(message) {
  process.stderr.write(`make-seo-images: ${message}\n`);
  process.exit(1);
}

// Only raster inputs may reach sharp from disk. sharp detects the format by content, so a
// file swapped for an SVG would otherwise be decoded by librsvg (GHSA-wq5f-xc86-pv6w).
function readRaster(path) {
  const buf = readFileSync(path);
  const isPng = buf.length > 8 && buf.readUInt32BE(0) === 0x89504e47 && buf.readUInt32BE(4) === 0x0d0a1a0a;
  const isJpeg = buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (!isPng && !isJpeg) fail(`${path} is not a PNG or JPEG file`);
  return buf;
}

function writeOutput(path, buf) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, buf);
  process.stdout.write(`${path.slice(repoRoot.length + 1).replace(/\\/g, "/")} ${buf.length} bytes\n`);
}

// PNG-embedded ICO: 6-byte header, one 16-byte entry per image, then the PNG files.
// pngs: [{ size, buf }] in ascending size order. Width/height byte 0 means 256.
function toIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = 6 + 16 * pngs.length;
  const entries = pngs.map(({ size, buf }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(buf.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += buf.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...pngs.map((png) => png.buf)]);
}

function rose(logoBuf, size) {
  return sharp(logoBuf).resize(size, size, { fit: "contain", background: transparent }).png().toBuffer();
}

// Text-only layer of the OG card. The same SVG is composited onto the card and scanned
// by the safe-area check, so the check sees exactly the pixels that ship.
// Wording is fixed by D-06: no dates, recruitment status or counts.
const textSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${ogWidth}" height="${ogHeight}">
  <g font-family="${fontStack}" font-weight="700">
    <text x="${textLeft}" y="268" font-size="84" fill="${accentColor}" letter-spacing="2">KLAN ARMA 3</text>
    <text x="${textLeft}" y="362" font-size="84" fill="${accentColor}" letter-spacing="2">MILSIM</text>
    <text x="${textLeft + 2}" y="430" font-size="30" fill="${creamColor}" letter-spacing="3">INGLOURIOUS BASTERDS CLAN</text>
  </g>
</svg>`;

// Scrim (darker on the left), HUD corner brackets and a thin rule under the headline.
function overlaySvg() {
  const inset = 28;
  const arm = 56;
  const r = ogWidth - inset;
  const b = ogHeight - inset;
  const bracket = (d) => `<path d="${d}" fill="none" stroke="${accentColor}" stroke-width="3" stroke-opacity="0.85"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ogWidth}" height="${ogHeight}">
  <defs>
    <linearGradient id="scrim" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${bgColor}" stop-opacity="0.94"/>
      <stop offset="0.55" stop-color="${bgColor}" stop-opacity="0.84"/>
      <stop offset="1" stop-color="${bgColor}" stop-opacity="0.72"/>
    </linearGradient>
  </defs>
  <rect width="${ogWidth}" height="${ogHeight}" fill="url(#scrim)"/>
  ${bracket(`M${inset} ${inset + arm} V${inset} H${inset + arm}`)}
  ${bracket(`M${r - arm} ${inset} H${r} V${inset + arm}`)}
  ${bracket(`M${inset} ${b - arm} V${b} H${inset + arm}`)}
  ${bracket(`M${r - arm} ${b} H${r} V${b - arm}`)}
  <rect x="${textLeft + 2}" y="388" width="120" height="3" fill="${accentColor}" fill-opacity="0.8"/>
</svg>`;
}

async function checkTextSafeArea() {
  const { data, info } = await sharp(Buffer.from(textSvg)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width !== ogWidth || info.height !== ogHeight) fail(`text layer rendered at ${info.width}x${info.height}`);
  let inked = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * info.channels + 3] === 0) continue;
      inked++;
      if (x >= safeArea.right || y < safeArea.top || y >= safeArea.bottom || x < safeArea.minX) {
        fail("OG text leaves the safe area, shorten or shrink the headline");
      }
    }
  }
  if (inked === 0) fail("OG text layer rendered no pixels (missing font?)");
}

async function makeOgCard(logoBuf, heroBuf) {
  await checkTextSafeArea();
  const logo = await rose(logoBuf, logoBox.size);
  const jpeg = await sharp(heroBuf)
    .resize(ogWidth, ogHeight, { fit: "cover" })
    .composite([
      { input: Buffer.from(overlaySvg()), left: 0, top: 0 },
      { input: logo, left: logoBox.left, top: logoBox.top },
      { input: Buffer.from(textSvg), left: 0, top: 0 },
    ])
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  if (jpeg.length >= ogMaxBytes) fail(`OG card is ${jpeg.length} bytes, it must stay under ${ogMaxBytes}`);
  return jpeg;
}

// 512x512 rounded dark tile with the rose at about 76 % of the tile (D-08).
async function makeIconMaster(logoBuf) {
  const tile = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" rx="96" fill="${bgColor}"/></svg>`
  );
  const logo = await rose(logoBuf, 390);
  return sharp(tile).composite([{ input: logo, left: 61, top: 61 }]).png().toBuffer();
}

// Full-bleed square, no alpha: iOS applies its own mask.
async function makeAppleTouchIcon(logoBuf) {
  const logo = await rose(logoBuf, 137);
  return sharp({ create: { width: 180, height: 180, channels: 3, background: bgColor } })
    .composite([{ input: logo, left: 21, top: 21 }])
    .removeAlpha()
    .png()
    .toBuffer();
}

function resizePng(buf, size) {
  return sharp(buf).resize(size, size).png().toBuffer();
}

async function main() {
  const logoBuf = readRaster(inputs.logo);
  const heroBuf = readRaster(inputs.hero);

  const og = await makeOgCard(logoBuf, heroBuf);
  const master = await makeIconMaster(logoBuf);
  const appleTouch = await makeAppleTouchIcon(logoBuf);
  const icon192 = await resizePng(master, 192);
  const favicon = toIco(
    await Promise.all([16, 32, 48].map(async (size) => ({ size, buf: await resizePng(master, size) })))
  );
  const brandLogo = await sharp(logoBuf)
    .resize(512, 512, { fit: "contain", background: transparent })
    .ensureAlpha()
    .png()
    .toBuffer();

  writeOutput(outputs.og, og);
  writeOutput(outputs.appleTouch, appleTouch);
  writeOutput(outputs.icon192, icon192);
  writeOutput(outputs.icon512, master);
  writeOutput(outputs.brandLogo, brandLogo);
  writeOutput(outputs.favicon, favicon);
}

main().catch((error) => fail(error.message));
