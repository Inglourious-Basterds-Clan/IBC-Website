// WOFF2 table directory and cmap reader: the table tags of a WOFF2 font and every code
// point its cmap maps to a real glyph. Node built-ins only (node:zlib brotliDecompressSync),
// no font library, so the glyph test can prove Polish coverage of the committed font (D-10).
// Input that is not a WOFF2 file throws "not a WOFF2 file"; a directory, compressed block or
// cmap cut short throws too, so a damaged font never yields a partial set.

import { brotliDecompressSync } from "node:zlib";

// WOFF2 known-tag table, index 0..62 (flags bits 0-5; 63 means an explicit tag follows).
const knownTags = [
  "cmap", "head", "hhea", "hmtx", "maxp", "name", "OS/2", "post", "cvt ", "fpgm",
  "glyf", "loca", "prep", "CFF ", "VORG", "EBDT", "EBLC", "gasp", "hdmx", "kern",
  "LTSH", "PCLT", "VDMX", "vhea", "vmtx", "BASE", "GDEF", "GPOS", "GSUB", "EBSC",
  "JSTF", "MATH", "CBDT", "CBLC", "COLR", "CPAL", "SVG ", "sbix", "acnt", "avar",
  "bdat", "bloc", "bsln", "cvar", "fdsc", "feat", "fmtx", "fvar", "gvar", "hsty",
  "just", "lcar", "mort", "morx", "opbd", "prop", "trak", "Zapf", "Silf", "Glat",
  "Gloc", "Feat", "Sill",
];

const headerLength = 48;

function assertWoff2(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < headerLength || buffer.toString("latin1", 0, 4) !== "wOF2") {
    throw new Error("not a WOFF2 file");
  }
}

// Throws unless [offset, offset + length) lies inside data.
function need(data, offset, length, what) {
  if (offset < 0 || offset + length > data.length) throw new Error(`WOFF2 ${what} is cut short`);
}

function readBase128(buffer, pos) {
  let value = 0;
  for (let i = 0; i < 5; i++) {
    need(buffer, pos.offset, 1, "table directory");
    const byte = buffer[pos.offset++];
    // A leading 0x80 byte is an invalid (non-minimal) encoding.
    if (i === 0 && byte === 0x80) throw new Error("bad UIntBase128 in WOFF2 table directory");
    value = value * 128 + (byte & 0x7f);
    if (!(byte & 0x80)) return value;
  }
  throw new Error("bad UIntBase128 in WOFF2 table directory");
}

// Directory entries in order: { tag, length } where length is the stored (transformed
// where transformed) length inside the decompressed block. pos.offset ends after the directory.
function readDirectory(buffer) {
  assertWoff2(buffer);
  const numTables = buffer.readUInt16BE(12);
  const pos = { offset: headerLength };
  const tables = [];
  for (let i = 0; i < numTables; i++) {
    need(buffer, pos.offset, 1, "table directory");
    const flags = buffer[pos.offset++];
    const index = flags & 0x3f;
    const version = flags >> 6;
    let tag;
    if (index === 63) {
      need(buffer, pos.offset, 4, "table directory");
      tag = buffer.toString("latin1", pos.offset, pos.offset + 4);
      pos.offset += 4;
    } else {
      tag = knownTags[index];
      if (tag === undefined) throw new Error(`unknown WOFF2 table tag index ${index}`);
    }
    const origLength = readBase128(buffer, pos);
    const transformed = tag === "glyf" || tag === "loca" ? version === 0 : version !== 0;
    tables.push({ tag, length: transformed ? readBase128(buffer, pos) : origLength });
  }
  return { tables, directoryEnd: pos.offset };
}

export function woff2TableTags(buffer) {
  return readDirectory(buffer).tables.map((table) => table.tag);
}

// Format 4: segment arrays, idRangeOffset into glyphIdArray, idDelta mod 65536.
function readFormat4(cmap, offset, codePoints) {
  need(cmap, offset, 14, "cmap format 4 subtable");
  const segCount = cmap.readUInt16BE(offset + 6) / 2;
  const endCodes = offset + 14;
  const startCodes = endCodes + 2 * segCount + 2;
  const idDeltas = startCodes + 2 * segCount;
  const idRangeOffsets = idDeltas + 2 * segCount;
  need(cmap, endCodes, 8 * segCount + 2, "cmap format 4 subtable");
  for (let seg = 0; seg < segCount; seg++) {
    const end = cmap.readUInt16BE(endCodes + 2 * seg);
    const start = cmap.readUInt16BE(startCodes + 2 * seg);
    const delta = cmap.readUInt16BE(idDeltas + 2 * seg);
    const rangeOffsetAddress = idRangeOffsets + 2 * seg;
    const rangeOffset = cmap.readUInt16BE(rangeOffsetAddress);
    for (let code = start; code <= end && code !== 0xffff; code++) {
      let glyph;
      if (rangeOffset === 0) {
        glyph = (code + delta) & 0xffff;
      } else {
        const glyphAddress = rangeOffsetAddress + rangeOffset + 2 * (code - start);
        need(cmap, glyphAddress, 2, "cmap format 4 glyphIdArray");
        glyph = cmap.readUInt16BE(glyphAddress);
        if (glyph !== 0) glyph = (glyph + delta) & 0xffff;
      }
      if (glyph !== 0) codePoints.add(code);
    }
  }
}

// Format 12: sequential map groups (startCharCode, endCharCode, startGlyphID).
function readFormat12(cmap, offset, codePoints) {
  need(cmap, offset, 16, "cmap format 12 subtable");
  const groups = cmap.readUInt32BE(offset + 12);
  need(cmap, offset + 16, 12 * groups, "cmap format 12 subtable");
  for (let i = 0; i < groups; i++) {
    const group = offset + 16 + 12 * i;
    const start = cmap.readUInt32BE(group);
    const end = cmap.readUInt32BE(group + 4);
    const startGlyph = cmap.readUInt32BE(group + 8);
    if (end < start || end > 0x10ffff) throw new Error("bad cmap format 12 group");
    for (let code = start; code <= end; code++) {
      if (startGlyph + (code - start) !== 0) codePoints.add(code);
    }
  }
}

function parseCmap(cmap) {
  need(cmap, 0, 4, "cmap table");
  const numTables = cmap.readUInt16BE(2);
  need(cmap, 4, 8 * numTables, "cmap table");
  const codePoints = new Set();
  for (let i = 0; i < numTables; i++) {
    const record = 4 + 8 * i;
    const platform = cmap.readUInt16BE(record);
    const encoding = cmap.readUInt16BE(record + 2);
    const offset = cmap.readUInt32BE(record + 4);
    // Unicode subtables only: platform 0 (any encoding), Windows BMP (3,1) and full repertoire (3,10).
    if (!(platform === 0 || (platform === 3 && (encoding === 1 || encoding === 10)))) continue;
    need(cmap, offset, 2, "cmap subtable");
    const format = cmap.readUInt16BE(offset);
    if (format === 4) readFormat4(cmap, offset, codePoints);
    else if (format === 12) readFormat12(cmap, offset, codePoints);
  }
  return codePoints;
}

export function woff2CodePoints(buffer) {
  const { tables, directoryEnd } = readDirectory(buffer);
  const compressedSize = buffer.readUInt32BE(20);
  need(buffer, directoryEnd, compressedSize, "compressed block");
  const data = brotliDecompressSync(buffer.subarray(directoryEnd, directoryEnd + compressedSize));
  let offset = 0;
  for (const table of tables) {
    if (table.tag === "cmap") {
      need(data, offset, table.length, "cmap table");
      return parseCmap(data.subarray(offset, offset + table.length));
    }
    offset += table.length;
  }
  throw new Error("WOFF2 file has no cmap table");
}
