import { mkdir, readFile, writeFile } from "node:fs/promises";
import { deflateSync } from "node:zlib";
import {
  LOGOMARK_BARS,
  LOGOMARK_COLORS,
  LOGOMARK_GRADIENT_STOPS,
  LOGOMARK_VIEWBOX,
} from "../src/lib/logomark.mjs";

const publicDir = new URL("../public/", import.meta.url);
const supersample = 4;
const crcTable = Array.from({ length: 256 }, (_, index) => {
  let current = index;
  for (let bit = 0; bit < 8; bit += 1) {
    current = current & 1 ? 0xedb88320 ^ (current >>> 1) : current >>> 1;
  }

  return current >>> 0;
});

const pngTargets = [
  { name: "favicon-16x16.png", size: 16, background: null, padding: 0.08 },
  { name: "favicon-32x32.png", size: 32, background: null, padding: 0.08 },
  { name: "favicon-48x48.png", size: 48, background: null, padding: 0.08 },
  { name: "favicon-96x96.png", size: 96, background: null, padding: 0.08 },
  { name: "apple-touch-icon.png", size: 180, background: LOGOMARK_COLORS.background, padding: 0.14 },
  { name: "android-chrome-192x192.png", size: 192, background: LOGOMARK_COLORS.background, padding: 0.14 },
  { name: "android-chrome-512x512.png", size: 512, background: LOGOMARK_COLORS.background, padding: 0.14 },
  { name: "maskable-icon-192x192.png", size: 192, background: LOGOMARK_COLORS.background, padding: 0.24 },
  { name: "maskable-icon-512x512.png", size: 512, background: LOGOMARK_COLORS.background, padding: 0.24 },
  { name: "mstile-150x150.png", size: 150, background: LOGOMARK_COLORS.background, padding: 0.18 },
];

await mkdir(publicDir, { recursive: true });

const pngs = new Map();
for (const target of pngTargets) {
  const png = createIconPng(target);
  pngs.set(target.name, png);
  await writeIfChanged(new URL(target.name, publicDir), png);
}

await writeIfChanged(new URL("favicon.svg", publicDir), renderSvg({ background: null, padding: 0.08 }));
await writeIfChanged(
  new URL("safari-pinned-tab.svg", publicDir),
  renderSvg({ background: null, fill: "#000", padding: 0.08 }),
);
await writeIfChanged(
  new URL("favicon.ico", publicDir),
  createIco([
    pngs.get("favicon-16x16.png"),
    pngs.get("favicon-32x32.png"),
    pngs.get("favicon-48x48.png"),
  ]),
);
await writeIfChanged(
  new URL("site.webmanifest", publicDir),
  `${JSON.stringify(
    {
      name: "Token Use",
      short_name: "Token Use",
      icons: [
        { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
        { src: "/maskable-icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
        { src: "/maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
      theme_color: LOGOMARK_COLORS.background,
      background_color: LOGOMARK_COLORS.background,
      display: "standalone",
    },
    null,
    2,
  )}\n`,
);
await writeIfChanged(
  new URL("browserconfig.xml", publicDir),
  `<?xml version="1.0" encoding="utf-8"?>\n<browserconfig>\n  <msapplication>\n    <tile>\n      <square150x150logo src="/mstile-150x150.png"/>\n      <TileColor>${LOGOMARK_COLORS.background}</TileColor>\n    </tile>\n  </msapplication>\n</browserconfig>\n`,
);

console.log(`Generated ${pngTargets.length + 5} favicon files in public/`);

function renderSvg({ background, fill = "url(#token-use-favicon-gradient)", padding }) {
  const size = 512;
  const geometry = iconGeometry(size, padding);
  const gradient = fill.startsWith("url(")
    ? `  <defs>
    <linearGradient id="token-use-favicon-gradient" x1="0" y1="${round(geometry.y)}" x2="0" y2="${round(
      geometry.y + LOGOMARK_VIEWBOX.height * geometry.scale,
    )}" gradientUnits="userSpaceOnUse">
${LOGOMARK_GRADIENT_STOPS.map(
  (stop) => `      <stop offset="${stop.offset * 100}%" stop-color="${stop.color}"/>`,
).join("\n")}
    </linearGradient>
  </defs>
`
    : "";
  const backgroundRect = background ? `  <rect width="${size}" height="${size}" fill="${background}"/>\n` : "";
  const bars = LOGOMARK_BARS.map(
    (bar) =>
      `  <rect x="${round(geometry.x + bar.x * geometry.scale)}" y="${round(
        geometry.y + bar.y * geometry.scale,
      )}" width="${round(bar.width * geometry.scale)}" height="${round(bar.height * geometry.scale)}" rx="${round(
        bar.rx * geometry.scale,
      )}" fill="${fill}"/>`,
  ).join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none">
${gradient}${backgroundRect}${bars}
</svg>
`;
}

function createIconPng({ size, background, padding }) {
  const highSize = size * supersample;
  const highPixels = Buffer.alloc(highSize * highSize * 4);
  const geometry = iconGeometry(highSize, padding);
  const backgroundColor = background ? hexToRgb(background) : null;

  for (let y = 0; y < highSize; y += 1) {
    for (let x = 0; x < highSize; x += 1) {
      const offset = (y * highSize + x) * 4;
      if (backgroundColor) {
        highPixels[offset] = backgroundColor.r;
        highPixels[offset + 1] = backgroundColor.g;
        highPixels[offset + 2] = backgroundColor.b;
        highPixels[offset + 3] = 255;
      }

      const sourceX = (x + 0.5 - geometry.x) / geometry.scale;
      const sourceY = (y + 0.5 - geometry.y) / geometry.scale;
      if (!LOGOMARK_BARS.some((bar) => roundedRectContains(sourceX, sourceY, bar))) {
        continue;
      }

      const color = gradientAt(sourceY / LOGOMARK_VIEWBOX.height);
      highPixels[offset] = color.r;
      highPixels[offset + 1] = color.g;
      highPixels[offset + 2] = color.b;
      highPixels[offset + 3] = 255;
    }
  }

  return encodePng(downsampleRgba(highPixels, highSize, size), size, size);
}

function iconGeometry(size, paddingRatio) {
  const targetHeight = size * (1 - paddingRatio * 2);
  const scale = targetHeight / LOGOMARK_VIEWBOX.height;
  const targetWidth = LOGOMARK_VIEWBOX.width * scale;

  return {
    x: (size - targetWidth) / 2,
    y: size * paddingRatio,
    scale,
  };
}

function roundedRectContains(x, y, rect) {
  if (x < rect.x || x > rect.x + rect.width || y < rect.y || y > rect.y + rect.height) {
    return false;
  }

  const radius = Math.min(rect.rx, rect.width / 2, rect.height / 2);
  const centerX = clamp(x, rect.x + radius, rect.x + rect.width - radius);
  const centerY = clamp(y, rect.y + radius, rect.y + rect.height - radius);
  const dx = x - centerX;
  const dy = y - centerY;

  return dx * dx + dy * dy <= radius * radius;
}

function downsampleRgba(source, sourceSize, targetSize) {
  const target = Buffer.alloc(targetSize * targetSize * 4);
  const factor = sourceSize / targetSize;

  for (let y = 0; y < targetSize; y += 1) {
    for (let x = 0; x < targetSize; x += 1) {
      let alpha = 0;
      let red = 0;
      let green = 0;
      let blue = 0;

      for (let sampleY = 0; sampleY < factor; sampleY += 1) {
        for (let sampleX = 0; sampleX < factor; sampleX += 1) {
          const sourceOffset = ((y * factor + sampleY) * sourceSize + x * factor + sampleX) * 4;
          const sampleAlpha = source[sourceOffset + 3];
          alpha += sampleAlpha;
          red += source[sourceOffset] * sampleAlpha;
          green += source[sourceOffset + 1] * sampleAlpha;
          blue += source[sourceOffset + 2] * sampleAlpha;
        }
      }

      const targetOffset = (y * targetSize + x) * 4;
      const samples = factor * factor;
      const averageAlpha = Math.round(alpha / samples);
      target[targetOffset] = alpha > 0 ? Math.round(red / alpha) : 0;
      target[targetOffset + 1] = alpha > 0 ? Math.round(green / alpha) : 0;
      target[targetOffset + 2] = alpha > 0 ? Math.round(blue / alpha) : 0;
      target[targetOffset + 3] = averageAlpha;
    }
  }

  return target;
}

function encodePng(rgba, width, height) {
  const rowLength = width * 4 + 1;
  const raw = Buffer.alloc(rowLength * height);

  for (let y = 0; y < height; y += 1) {
    raw[y * rowLength] = 0;
    rgba.copy(raw, y * rowLength + 1, y * width * 4, (y + 1) * width * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", concatBuffers(uint32(width), uint32(height), Buffer.from([8, 6, 0, 0, 0]))),
    pngChunk("IDAT", deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const body = concatBuffers(typeBuffer, data);

  return concatBuffers(uint32(data.length), body, uint32(crc32(body)));
}

function createIco(images) {
  const headerSize = 6;
  const entrySize = 16;
  let offset = headerSize + images.length * entrySize;
  const header = Buffer.alloc(offset);

  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  images.forEach((image, index) => {
    const imageSize = readPngSize(image);
    const entryOffset = headerSize + index * entrySize;
    header[entryOffset] = imageSize.width >= 256 ? 0 : imageSize.width;
    header[entryOffset + 1] = imageSize.height >= 256 ? 0 : imageSize.height;
    header[entryOffset + 2] = 0;
    header[entryOffset + 3] = 0;
    header.writeUInt16LE(1, entryOffset + 4);
    header.writeUInt16LE(32, entryOffset + 6);
    header.writeUInt32LE(image.length, entryOffset + 8);
    header.writeUInt32LE(offset, entryOffset + 12);
    offset += image.length;
  });

  return Buffer.concat([header, ...images]);
}

function readPngSize(png) {
  return {
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20),
  };
}

async function writeIfChanged(fileUrl, value) {
  const next = Buffer.isBuffer(value) ? value : Buffer.from(value);

  try {
    const current = await readFile(fileUrl);
    if (current.equals(next)) {
      return;
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  await writeFile(fileUrl, next);
}

function gradientAt(position) {
  const value = clamp(position, 0, 1);

  for (let index = 0; index < LOGOMARK_GRADIENT_STOPS.length - 1; index += 1) {
    const start = LOGOMARK_GRADIENT_STOPS[index];
    const end = LOGOMARK_GRADIENT_STOPS[index + 1];

    if (value < start.offset || value > end.offset) {
      continue;
    }

    return interpolateColor(hexToRgb(start.color), hexToRgb(end.color), (value - start.offset) / (end.offset - start.offset));
  }

  return hexToRgb(LOGOMARK_GRADIENT_STOPS.at(-1).color);
}

function interpolateColor(start, end, amount) {
  return {
    r: Math.round(start.r + (end.r - start.r) * amount),
    g: Math.round(start.g + (end.g - start.g) * amount),
    b: Math.round(start.b + (end.b - start.b) * amount),
  };
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");

  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function crc32(buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function uint32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value >>> 0, 0);
  return buffer;
}

function concatBuffers(...buffers) {
  return Buffer.concat(buffers);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round(value) {
  return Number(value.toFixed(4));
}
