// Generates /sw.js after the production build. Caches only explicit built app
// assets (never conversation data). Does not skipWaiting, so updates never
// discard active work.
import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { privacyPolicy } from "../src/privacy-policy.js";

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}
const root = (await exists(".output/public"))
  ? ".output/public"
  : (await exists("dist/client"))
    ? "dist/client"
    : "dist";

async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((e) => (e.isDirectory() ? files(`${dir}/${e.name}`) : `${dir}/${e.name}`)),
    )
  ).flat();
}
const paths = (await files(root)).filter(
  (p) =>
    !p.endsWith("sw.js") &&
    !p.includes("/.") &&
    !p.endsWith(".map") &&
    !["sw.js", "_headers", "_redirects", "_worker.js"].includes(p.split("/").pop()),
);
const contents = await Promise.all(paths.map((p) => readFile(p)));
const version = createHash("sha256").update(Buffer.concat(contents)).digest("hex").slice(0, 12);
const urls = paths.map((p) => p.slice(root.length));

await writeFile(
  `${root}/sw.js`,
  `const CACHE='between-${version}';const FILES=${JSON.stringify(urls)};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(async c=>{await c.addAll(FILES);try{const r=await fetch('/',{cache:'reload'});if(r.ok)await c.put('/',r);}catch{}})));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('between-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin||u.pathname.startsWith('/~oauth'))return;if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).then(r=>{if(r.ok&&u.pathname==='/'){const copy=r.clone();caches.open(CACHE).then(c=>c.put('/',copy));}return r;}).catch(()=>caches.match('/')));return;}if(FILES.includes(u.pathname))e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request)));});`,
);
console.log(`sw.js written to ${root} with ${urls.length} assets`);

// Static hosts apply these headers to the app document and parser worker.
const headersPath = `${root}/_headers`;
const currentHeaders = (await exists(headersPath)) ? await readFile(headersPath, "utf8") : "";
await writeFile(
  headersPath,
  currentHeaders +
    `\n/\n  Content-Security-Policy: ${privacyPolicy}\n/assets/import.worker-*\n  Content-Security-Policy: connect-src 'none'; script-src 'self'\n`,
);
