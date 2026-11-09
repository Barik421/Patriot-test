import { log } from "node:console";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const pages = ["", "how-it-works/"];
const canonicals = [];
for (const path of pages) {
  const html = await readFile(`dist/${path}index.html`, "utf8");
  assert.match(html, /<html lang="uk">/);
  assert.equal(
    (html.match(/<h1(?:\s|>)/g) || []).length,
    1,
    `Exactly one prerendered h1: ${path}`,
  );
  assert.match(html, /name="description"\s+content="[^"]{40,}"/);
  assert.match(html, /name="twitter:title"/);
  assert.match(html, /name="twitter:description"/);
  assert.match(html, /href="\/(?:[^"#]+\/)?how-it-works\/"/);
  assert.doesNotMatch(html, /location\.search\s*\|\|/);
  for (const block of html.matchAll(
    /<script type="application\/ld\+json">(.*?)<\/script>/gs,
  ))
    JSON.parse(block[1]);
  const canonical = html.match(/rel="canonical" href="([^"]+)"/);
  if (canonical) {
    assert.equal((html.match(/rel="canonical"/g) || []).length, 1);
    assert(!canonical[1].includes("#"));
    assert(canonical[1].endsWith(path || "/"));
    assert(!/<meta name="robots" content="noindex/.test(html));
    canonicals.push(canonical[1]);
  } else assert.match(html, /<meta name="robots" content="noindex,follow"/);
  for (const match of html.matchAll(
    /(?:src|href)="([^"]*\/assets\/[^"?#]+)"/g,
  )) {
    assert(
      match[1].startsWith("/"),
      `Absolute asset path on nested page: ${path}`,
    );
  }
  assert(
    path
      ? html.includes("Звідки береться твій типаж?")
      : html.includes("Що таке «Тест на патріота»?"),
  );
}
if (canonicals.length) {
  assert.equal(new Set(canonicals).size, 2, "Distinct canonical URLs");
  const sitemap = await readFile("dist/sitemap.xml", "utf8");
  for (const url of canonicals) assert(sitemap.includes(`<loc>${url}</loc>`));
}
log(
  "SEO checks passed: two prerendered pages, unique canonicals, crawlable links, metadata, structured data and sitemap.",
);
