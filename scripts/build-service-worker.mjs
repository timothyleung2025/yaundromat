import { readdir, readFile, writeFile, access } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = new URL("../", import.meta.url);
const buildId = (
  await readFile(new URL(".next/BUILD_ID", root), "utf8")
).trim();
async function files(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const name = `${prefix}${entry.name}`;
      return entry.isDirectory()
        ? files(join(directory, entry.name), `${name}/`)
        : [name];
    }),
  );
  return nested.flat();
}
const chunks = (await files(fileURLToPath(new URL(".next/static/", root))))
  .filter((file) => /\.(js|css|woff2?)$/.test(file))
  .map((file) => `/_next/static/${file}`);
const publicAssets = [
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable.png",
  "/apple-icon.png",
];
// Include exactly the local fonts referenced by our global @font-face rules.
const styles = await readFile(new URL("src/app/globals.css", root), "utf8");
const fonts = [...styles.matchAll(/url\("(\/fonts\/[^"\n]+)"\)/g)].map(
  (match) => match[1],
);
for (const asset of [...publicAssets, ...fonts])
  await access(new URL(`public${asset}`, root));
const precache = [
  ...new Set([
    "/",
    "/manifest.webmanifest",
    ...publicAssets,
    ...fonts,
    ...chunks,
  ]),
]
  .map(encodeURI)
  .sort();
const template = await readFile(
  new URL("src/pwa/service-worker.js", root),
  "utf8",
);
const version = createHash("sha256")
  .update(buildId + template + JSON.stringify(precache))
  .digest("hex")
  .slice(0, 16);
const worker = template
  .replace("__BUILD_VERSION__", JSON.stringify(version))
  .replace("__PRECACHE_URLS__", JSON.stringify(precache, null, 2));
await writeFile(new URL("public/sw.js", root), worker);
console.log(
  `PWA: generated ${version} with ${precache.length} offline assets.`,
);
