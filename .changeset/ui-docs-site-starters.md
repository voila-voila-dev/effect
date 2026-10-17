---
"@voila.dev/ui-docs": minor
---

Three exports for a site starting out: `lib/english-messages` (`englishMessages`, every `DocsMessages` word in English, to spread and override), `lib/lazy-content` (`lazyContent(load)`, a page body as a lazy component a route loader preloads so a prerendered page hydrates without a flash), and `styles/sources.css` (the `@source` lines Tailwind needs, relative to the installed package). Nothing existing changes.
