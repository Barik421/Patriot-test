# Тест на патріота · Patriot Test

A Ukrainian-language satirical personality quiz: **«Патріот чи зрадойоб?»**. This is entertainment, not a political or psychological assessment. A quiet, editorial homepage and focused quiz lead to expressive, category-specific results.

## Stack and development

React 19, Vite 7, TypeScript, plain responsive CSS, self-hosted Manrope (Ukrainian Cyrillic), Canvas PNG export, Vitest and ESLint. Static hosting only; no backend, accounts, paid APIs or runtime font requests. Node.js 22.12+ recommended.

```sh
npm ci
cp .env.example .env.local
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

## Configuration

| Variable                        | Purpose                                                                                            |
| ------------------------------- | -------------------------------------------------------------------------------------------------- |
| `VITE_BASE_PATH`                | `/Patriot-test/` for repository GitHub Pages, `/` for root hosting. Default `/`.                   |
| `VITE_SITE_URL`                 | Actual absolute HTTPS URL ending in `/`, including the base path. No production domain is assumed. |
| `VITE_GA_MEASUREMENT_ID`        | Optional real `G-...` GA4 ID. Analytics is disabled when absent/invalid.                           |
| `VITE_GOOGLE_SITE_VERIFICATION` | Optional Search Console HTML verification token.                                                   |

All Vite values are public build-time configuration, never secrets. With no site URL the build deliberately emits `noindex` and a disallowing robots.txt; set the real URL before public launch. Share links use the configured URL or current origin/base path locally.

## Content and scoring

`src/data/questions.ts` contains 120 original questions, each with four answers. Editorial columns represent the four archetypes. Each answer carries an immutable score vector, independent of its shuffled display position:

| Archetype      | Patriot | Almost patriot | Almost zrada | Zrada |
| -------------- | ------- | -------------- | ------------ | ----- |
| Patriot        | 6       | 2              | 1            | 0     |
| Almost patriot | 2       | 6              | 1            | 0     |
| Almost zrada   | 0       | 1              | 6            | 2     |
| Zrada          | 0       | 1              | 2            | 6     |

Each row totals 9. Fisher–Yates chooses 20 unique questions and separately shuffles the answer IDs. The largest category total wins. Ties deterministically prefer the inner archetypes in this order: almost patriot, almost zrada, patriot, zrada. Affinity percentage is `round(winning total / (20 × 6) × 100)`, **not probability or an actual measure of patriotism**. A stable hash of question/answer IDs selects one of ten descriptions per category. No scores appear during the quiz.

`src/lib/quiz.ts` is pure and tested. Add rows to expand the bank (update the content-count test and editorial copy when the bank size changes). Result palettes, emojis and 40 original descriptions are in `src/data/results.ts`.

## Navigation, persistence and sharing

An unfinished session stores the selected question IDs, answer display order, answers and current index under `patriot:session`. Saved data is validated against the current database. Back navigation preserves answers; changing an answer replaces its contribution. Completion requires all 20 answers. Start again creates a fresh random draw. No scores or answers are transmitted.

Themes follow the OS on the first visit; manual choice is saved locally. Storage failures do not break the running quiz. Results use validated hash URLs such as `#result=patriot&p=80&v=2`, so direct links work on GitHub Pages without server routing. Links are editable entertainment artifacts, not authenticated certificates. Browser back/forward is supported. An invalid hash opens the homepage.

PNG exports are 1080×1920 (story) and 1080×1080 (square), generated entirely by Canvas after fonts finish loading. Native Web Share shares text and a result URL; unavailable/denied sharing falls back to copying the link. Clipboard denial reveals a selectable input. Downloaded PNGs can be shared through any social app manually. Emoji artwork can vary by OS.

## GitHub Pages

1. In repository **Settings → Pages → Build and deployment**, select **GitHub Actions**.
2. Optional repository Actions variables: the four variables above. The default workflow base is `/Patriot-test/`.
3. The workflow gets the actual public URL from `actions/configure-pages` unless `VITE_SITE_URL` is explicitly provided. It never invents a domain.
4. Push/merge into `main` or manually run the workflow. Pull requests run all checks without deploying.
5. Check the Pages environment's returned URL. For a custom domain configure GitHub Pages DNS and set `VITE_BASE_PATH=/`, `VITE_SITE_URL=https://your-actual-domain/` using your real domain.

The workflow runs type checking, lint, tests, production build and static prerendering, then publishes `dist/`. Branch protection and Pages source selection are repository owner settings.

## SEO and Search Console

Build-time SSR places the full Ukrainian homepage, result previews, explanatory content and FAQ in the initial HTML. It includes title/description, canonical and OG URL/image when configured, Twitter cards, FAQPage/WebApplication structured data, lang=uk, favicon, robots.txt and a one-URL sitemap. The fixed social preview is `public/og-card.png`. Client quiz/result states and parameterized URLs receive noindex; the canonical always points to the homepage. Hash results do not create new server paths. Social crawlers see the generic site preview, not a personalized result; use PNGs for personalized previews.

Set the real site URL, add the actual Search Console token via `VITE_GOOGLE_SITE_VERIFICATION` (or use DNS verification), rebuild, verify ownership and submit `<actual site URL>sitemap.xml`. FAQ markup describes visible content and does not guarantee rich results.

## Optional GA4 and consent

Set a real measurement ID, rebuild and use the on-page consent banner. **No Google script or nonessential analytics loads before explicit consent.** Allow/decline buttons have equal prominence. The footer privacy dialog permits withdrawal and deletion of quiz progress. Declining sets the GA disable flag and clears accessible first-party GA cookies; existing loaded scripts cannot be unloaded from memory, but event tracking stops immediately. GA4 is configured without automatic page views, Google signals or ad personalization.

Events: `quiz_start`, `quiz_question_view`, `quiz_complete`, `quiz_result`, `quiz_restart`, `result_share`, `result_download`, `theme_change`. No names, email, answer text, session IDs or result URLs are sent. A question view fires on navigation, not each answer click. Completed and result events fire once per completed run; opening a shared result does not count as completion. Events before consent are discarded, not replayed. Hosts may keep technical request logs independently.

Review your real GA property retention settings and hosting privacy details before launch. Fonts are self-hosted; there are no ads or trackers besides optional consented GA4.

## Accessibility and validation

Native buttons, visible focus, skip link, semantic headings, labeled progress and formats, live status messages and an accessible modal. Answer keys 1–4 supplement normal Tab/Enter/Space navigation. Reduced-motion disables animations/effects; no flashing. Results remain readable without decorative effects. Both themes use dedicated surface, border and text colors.

`npm test` runs 30 checks covering all content, weights, 250 randomized sessions, persistence validation, all categories, ties, answer changes, result URL validation, sharing fallbacks, storage denial, and consent/withdrawal. Browser QA should also cover a full mobile run, refresh/back navigation, all palettes and themes, both PNG sizes, native share/clipboard fallback and reduced motion. Native share and actual GA delivery depend on real device support/configuration and should be verified on target devices.
