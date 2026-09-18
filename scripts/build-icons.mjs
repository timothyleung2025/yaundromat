import { readFile } from "node:fs/promises";
import sharp from "sharp";
const root = new URL("../public/", import.meta.url);
const svg = await readFile(new URL("icon.svg", root), "utf8");
for (const [name, size] of [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["apple-icon.png", 180],
]) {
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .flatten({ background: "#f3f8fa" })
    .png()
    .toFile(new URL(name, root).pathname);
}
// Opaque full-bleed background and a smaller mark keep all details within maskable safe bounds.
const mask = svg
  .replace('rx="108" fill="url(#paper)"', 'rx="0" fill="url(#paper)"')
  .replace(
    '<g id="washer">',
    '<g id="washer" transform="translate(46.08 46.08) scale(.82)">',
  );
await sharp(Buffer.from(mask))
  .resize(512, 512)
  .png()
  .toFile(new URL("icon-maskable.png", root).pathname);
console.log(
  "Generated app, Apple touch, and maskable icons from public/icon.svg.",
);
