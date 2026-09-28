// Writes src/app/favicon.ico from the app's own PNG icon (16, 32 and 48 px), without any image library.
// Usage, with the dev server running: node scripts/make-favicon.mjs [origin]
import { writeFile } from "node:fs/promises";

const origin = process.argv[2] ?? "http://localhost:3000";
const sizes = [16, 32, 48];

const images = await Promise.all(
  sizes.map(async (size) => {
    const res = await fetch(`${origin}/icon.png?size=${size}&simple=1`);
    if (!res.ok) throw new Error(`GET /icon.png?size=${size} answered ${res.status}`);
    return { size, png: Buffer.from(await res.arrayBuffer()) };
  }),
);

// ICO = 6-byte header + one 16-byte directory entry per image + the PNG files themselves.
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = 6 + 16 * images.length;
const entries = images.map(({ size, png }) => {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size, 0);
  entry.writeUInt8(size, 1);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(offset, 12);
  offset += png.length;
  return entry;
});

await writeFile(new URL("../src/app/favicon.ico", import.meta.url), Buffer.concat([header, ...entries, ...images.map((i) => i.png)]));
console.log(`Wrote src/app/favicon.ico (${sizes.join(", ")} px)`);
