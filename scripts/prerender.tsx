import { mkdir, readFile, writeFile } from "node:fs/promises";
import { loadEnv } from "vite";
import { renderToString } from "react-dom/server";
import App from "../src/App";
import { faqs } from "../src/data/faq";
import { publicPaths } from "../src/lib/paths";
const env = { ...loadEnv("production", process.cwd(), ""), ...process.env };
const site = env.VITE_SITE_URL?.trim();
if (site && !/^https:\/\/[^\s?#]+\/$/.test(site))
  throw new Error(
    "VITE_SITE_URL must be an HTTPS URL ending in /, including the base path.",
  );
const base = publicPaths(env.VITE_BASE_PATH || "/").home;
const escape = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
const json = (data: unknown) =>
  `<script type="application/ld+json">${JSON.stringify(data).replaceAll("<", "\\u003c")}</script>`;
const template = await readFile("dist/index.html", "utf8");
const pages = [
  {
    page: "home" as const,
    path: "",
    title: "Патріот чи зрадойоб? — Тест на патріота України",
    description:
      "Ти патріот, недопатріот чи справжній зрадойоб? Пройди безкоштовний жартівливий тест на патріота України з 20 випадкових запитань та поділися результатом!",
  },
  {
    page: "how" as const,
    path: "how-it-works/",
    title: "Як працює тест на патріота — правила, результати й поширення",
    description:
      "Як пройти український тест «Патріот чи зрадойоб?»: 20 випадкових запитань, чотири типажі, підрахунок відсотка та картки для сторіз. Дізнайся правила й почни тест.",
  },
];
for (const page of pages) {
  const canonical = site ? `${site}${page.path}` : "";
  let html = template.replace(
    '<div id="root"></div>',
    `<div id="root">${renderToString(<App staticPage={page.page} basePath={base} />)}</div>`,
  );
  html = html.replace(
    /<title>[\s\S]*?<\/title>/,
    `<title>${escape(page.title)}</title>`,
  );
  html = html.replace(
    /(<meta\s+(?:name="description"|property="og:title"|property="og:description")\s+content=")[^"]*("\s*\/?>)/g,
    (match, prefix, suffix) =>
      `${prefix}${escape(match.includes("og:title") ? page.title : page.description)}${suffix}`,
  );
  const metadata = [
    canonical
      ? `<link rel="canonical" href="${escape(canonical)}" /><meta property="og:url" content="${escape(canonical)}" /><meta property="og:image" content="${escape(site!)}og-card.png" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /><meta property="og:image:alt" content="Патріот чи зрадойоб? Український онлайн-тест" /><meta name="twitter:image" content="${escape(site!)}og-card.png" />`
      : '<meta name="robots" content="noindex,follow" />',
    `<meta name="twitter:title" content="${escape(page.title)}" /><meta name="twitter:description" content="${escape(page.description)}" />`,
    env.VITE_GOOGLE_SITE_VERIFICATION
      ? `<meta name="google-site-verification" content="${escape(env.VITE_GOOGLE_SITE_VERIFICATION)}" />`
      : "",
    page.page === "home"
      ? json({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          inLanguage: "uk",
          mainEntity: faqs.map(([name, text]) => ({
            "@type": "Question",
            name,
            acceptedAnswer: { "@type": "Answer", text },
          })),
        })
      : json({
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: page.title,
          description: page.description,
          inLanguage: "uk",
          ...(canonical ? { url: canonical } : {}),
          ...(site
            ? {
                isPartOf: {
                  "@type": "WebSite",
                  name: "Тест на патріота",
                  url: site,
                },
              }
            : {}),
        }),
    page.page === "home"
      ? json({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Тест на патріота",
          description: page.description,
          applicationCategory: "EntertainmentApplication",
          operatingSystem: "Any",
          inLanguage: "uk",
          creator: { "@type": "Person", name: "BRNV" },
          ...(site ? { url: site } : {}),
          offers: { "@type": "Offer", price: "0", priceCurrency: "UAH" },
        })
      : "",
  ].join("\n");
  html = html.replace("</head>", `${metadata}\n</head>`);
  await mkdir(`dist/${page.path}`, { recursive: true });
  await writeFile(`dist/${page.path}index.html`, html);
}
await writeFile(
  "dist/robots.txt",
  site
    ? `User-agent: *\nAllow: /\nSitemap: ${site}sitemap.xml\n`
    : "User-agent: *\nDisallow: /\n",
);
await writeFile(
  "dist/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${site ? pages.map((page) => `<url><loc>${escape(site + page.path)}</loc></url>`).join("") : ""}</urlset>`,
);
await writeFile("dist/.nojekyll", "");
console.log(
  `Prerendered ${pages.length} Ukrainian pages. Canonical URLs ${site ? "configured" : "not configured; indexing disabled"}.`,
);
