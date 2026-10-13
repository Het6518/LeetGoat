// Renders the LeetGoat mark to PNG icons (Chrome manifests don't accept SVG).
// Dependency-free: a tiny supersampled rasterizer + PNG encoder.
// Usage: node scripts/generate-icons.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";

const SIZES = [16, 32, 48, 128];
const SS = 4; // supersampling factor

function bezier(p0, p1, p2, p3, steps = 24) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push([
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    ]);
  }
  return pts;
}

// Same geometry as GoatMark in src/components/ui (24×24 grid).
const STROKES = [
  [...bezier([8.5, 8.5], [7, 5.5], [4.5, 4], [2.5, 4.5]), ...bezier([2.5, 4.5], [3.5, 6], [5, 7.5], [6.5, 8.5])],
  [...bezier([15.5, 8.5], [17, 5.5], [19.5, 4], [21.5, 4.5]), ...bezier([21.5, 4.5], [20.5, 6], [19, 7.5], [17.5, 8.5])],
  [[7, 9], [17, 9], [15.4, 15.2], [12, 20], [8.6, 15.2], [7, 9]],
];
const DOTS = [[10, 12.5], [14, 12.5]];

function distToSegment(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = dx * dx + dy * dy;
  const t = len ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len)) : 0;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function insideRoundedRect(x, y, size, r) {
  const cx = Math.min(Math.max(x, r), size - r);
  const cy = Math.min(Math.max(y, r), size - r);
  return Math.hypot(x - cx, y - cy) <= r;
}

const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const TOP = [255, 176, 46];
const BOTTOM = [217, 119, 6];
const INK = [28, 18, 4];

function render(size) {
  const pixels = Buffer.alloc(size * size * 4);
  // Thicker lines at small sizes so the mark stays legible.
  const stroke = size <= 16 ? 2.9 : size <= 32 ? 2.5 : 2.1;
  const pad = size <= 16 ? 0.5 : 2.5; // grid units of padding around the mark
  const scale = size / (24 + pad * 2);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS;
          const py = y + (sy + 0.5) / SS;
          if (!insideRoundedRect(px, py, size, size * 0.24)) continue;
          const gx = px / scale - pad;
          const gy = py / scale - pad;
          let ink = DOTS.some(([dx, dy]) => Math.hypot(gx - dx, gy - dy) <= stroke * 0.6);
          for (const line of STROKES) {
            if (ink) break;
            for (let i = 0; i < line.length - 1; i++) {
              if (distToSegment(gx, gy, line[i], line[i + 1]) <= stroke / 2) {
                ink = true;
                break;
              }
            }
          }
          const color = ink ? INK : mix(TOP, BOTTOM, py / size);
          r += color[0];
          g += color[1];
          b += color[2];
          a += 255;
        }
      }
      const n = SS * SS;
      const covered = a / 255;
      const i = (y * size + x) * 4;
      pixels[i] = covered ? r / covered : 0;
      pixels[i + 1] = covered ? g / covered : 0;
      pixels[i + 2] = covered ? b / covered : 0;
      pixels[i + 3] = a / n;
    }
  }
  return encodePng(size, pixels);
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePng(size, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const outDir = new URL("../public/icons/", import.meta.url);
mkdirSync(outDir, { recursive: true });
for (const size of SIZES) {
  writeFileSync(new URL(`icon${size}.png`, outDir), render(size));
  console.log(`icon${size}.png`);
}
