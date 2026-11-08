import { readFile, writeFile } from "node:fs/promises";
import { loadEnv } from "vite";
import { renderToString } from "react-dom/server";
import App from "../src/App";
import { faqs } from "../src/data/faq";
const env = { ...loadEnv("production", process.cwd(), ""), ...process.env };
const site = env.VITE_SITE_URL?.trim();
if (site && !/^https:\/\/[^\s?#]+\/$/.test(site))
  throw new Error(
    "VITE_SITE_URL must be an HTTPS URL ending in /, including the base path.",
  );
const esc = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
// import.meta.env is supplied in the app build; SSR uses guarded fallbacks in library modules.
let html = await readFile("dist/index.html", "utf8");
html = html.replace(
  '<div id="root"></div>',
  `<div id="root">${renderToString(<App />)}</div>`,
);
const metadata = [
  '<meta name="twitter:title" content="Патріот чи зрадойоб? — Тест на патріота" />',
  '<meta name="twitter:description" content="20 запитань, 4 типажі й багато самоіронії. Пройди тест та поділися результатом." />',
  site
    ? `<link rel="canonical" href="${esc(site)}" /><meta property="og:url" content="${esc(site)}" /><meta property="og:image" content="${esc(site)}og-card.png" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /><meta property="og:image:alt" content="Патріот чи зрадойоб? Жартівливий тест із 20 запитань" /><meta name="twitter:image" content="${esc(site)}og-card.png" />`
    : '<meta name="robots" content="noindex,follow" />',
  env.VITE_GOOGLE_SITE_VERIFICATION
    ? `<meta name="google-site-verification" content="${esc(env.VITE_GOOGLE_SITE_VERIFICATION)}" />`
    : "",
  `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", inLanguage: "uk", mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }).replaceAll("<", "\\u003c")}</script>`,
  `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "WebApplication", name: "Тест на патріота", applicationCategory: "EntertainmentApplication", operatingSystem: "Any", inLanguage: "uk", ...(site ? { url: site } : {}), offers: { "@type": "Offer", price: "0", priceCurrency: "UAH" } }).replaceAll("<", "\\u003c")}</script>`,
].join("\n");
html = html.replace("</head>", `${metadata}\n</head>`);
await writeFile("dist/index.html", html);
await writeFile(
  "dist/robots.txt",
  site
    ? `User-agent: *\nAllow: /\nSitemap: ${site}sitemap.xml\n`
    : "User-agent: *\nDisallow: /\n",
);
await writeFile(
  "dist/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${site ? `<url><loc>${esc(site)}</loc></url>` : ""}</urlset>`,
);
await writeFile("dist/.nojekyll", "");
console.log(
  `Prerendered Ukrainian homepage and structured data. Canonical URL ${site ? "configured" : "not configured; indexing disabled"}.`,
);
