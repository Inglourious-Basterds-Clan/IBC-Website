// Header-only image parsers: width/height (and alpha) from PNG and JPEG headers and the
// entry table of an ICO file. Node built-ins only, no image library, so tests and
// the SEO gate (lib/check-seo.js) can check the committed SEO images without sharp.
// Anything unrecognised, or a header cut short, returns null.

const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function readPng(buffer) {
  if (buffer.length < 26) return null;
  for (let i = 0; i < pngSignature.length; i++) {
    if (buffer[i] !== pngSignature[i]) return null;
  }
  if (buffer.toString("latin1", 12, 16) !== "IHDR") return null;
  const colourType = buffer[25];
  return {
    format: "png",
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    hasAlpha: colourType === 4 || colourType === 6,
  };
}

function readJpeg(buffer) {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) return null;
    // Skip fill bytes before the marker code.
    while (offset < buffer.length && buffer[offset] === 0xff) offset++;
    if (offset >= buffer.length) return null;
    const marker = buffer[offset];
    offset++;
    // Standalone markers carry no length.
    if ((marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) continue;
    // End of image or start of scan before any frame header.
    if (marker === 0xd9 || marker === 0xda) return null;
    if (offset + 2 > buffer.length) return null;
    const length = buffer.readUInt16BE(offset);
    if (length < 2) return null;
    const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) {
      // The marker's 0xFF byte sits at offset - 2: length at +2, precision at +4,
      // height at +5 and width at +7 from it.
      const markerOffset = offset - 2;
      if (markerOffset + 9 > buffer.length) return null;
      return {
        format: "jpeg",
        width: buffer.readUInt16BE(markerOffset + 7),
        height: buffer.readUInt16BE(markerOffset + 5),
        hasAlpha: false,
      };
    }
    offset += length;
  }
  return null;
}

export function readImageSize(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) return null;
  if (buffer[0] === 0x89) return readPng(buffer);
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return readJpeg(buffer);
  return null;
}

export function readIcoEntries(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 6) return null;
  if (buffer.readUInt16LE(0) !== 0 || buffer.readUInt16LE(2) !== 1) return null;
  const count = buffer.readUInt16LE(4);
  if (count < 1 || 6 + 16 * count > buffer.length) return null;
  const entries = [];
  for (let i = 0; i < count; i++) {
    const entry = 6 + 16 * i;
    entries.push({
      width: buffer[entry] || 256,
      height: buffer[entry + 1] || 256,
      size: buffer.readUInt32LE(entry + 8),
      offset: buffer.readUInt32LE(entry + 12),
    });
  }
  return entries;
}
