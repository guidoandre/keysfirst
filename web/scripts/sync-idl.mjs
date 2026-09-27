// Copies the IDL and TypeScript types produced by `anchor build` into the web app.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..", "..");
const outDir = path.resolve(import.meta.dirname, "..", "src", "idl");
fs.mkdirSync(outDir, { recursive: true });

for (const [from, to] of [
  ["target/idl/keysfirst.json", "keysfirst.json"],
  ["target/types/keysfirst.ts", "keysfirst.ts"],
]) {
  fs.copyFileSync(path.join(root, from), path.join(outDir, to));
  console.log(`Copied ${from} -> web/src/idl/${to}`);
}
