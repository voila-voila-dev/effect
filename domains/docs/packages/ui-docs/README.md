# @voila.dev/ui-docs

The React layer of a documentation site, on the models of
`@voila.dev/docs`: generic and copy-free. React 19, Tailwind CSS 4, Base UI
and Phosphor icons. It ships no words and no router: the host passes its
`Link`, its `navigate` and every string, in the reader's language.

```sh
bun add @voila.dev/ui-docs @voila.dev/docs @phosphor-icons/react react react-dom
```

| Export | What it renders |
| --- | --- |
| `components/docs-provider` | `DocsProvider`: the host's `Link` and `navigate`, its words (`DocsMessages`), its icon map, the reader's place in the navigation, the footer note every page ends with, the support contact, the audience storage key, the `CodeValue` constants and the reader context (its dimensions in the reader's words, where answers are remembered, each page's `appliesTo` by href). A navigation group with an `audience` is one of that audience's topics and shows only while the reader is in it; the sidebar's switcher, one segment per audience of the tab, changes it. Before any audience is chosen, every audience's topics show under its name. A page's `sidebarTitle` replaces its title in the sidebar, the full title in its tooltip |
| `components/docs-frame` | The frame: a fixed header (slots `brand`, `actions`, `menuLinks`), a fixed sidebar with the search and the theme switcher, the page in a rounded panel |
| `components/docs-page`, `docs-page-header`, `docs-toc`, `docs-footer`, `page-actions` | A page's column and aside, its breadcrumb, h1 and split copy button (slot `meta`), the outline with scroll-spy, the previous and next cards |
| `components/docs-guide`, `components/guide/*` | `DocsGuideProvider` (a page's resolved prerequisites, next pages, path, sources), and what the host renders around the content from it: `PathProgress`, `Prerequisites`, `OtherVariants`, `Sources`, `UsedInPaths`, `NextSteps`, and `StillStuck`, which `DocsFooter` ends every page with |
| `components/reader-context`, `reader-context-chip` | `useReaderContext` (the reader's answers, kept in `localStorage` through a wrapped access, none on the server so every variant prerenders; `matches(appliesTo)` for a passage the host renders itself), `ReaderContextPicker` (one select per dimension the audience is asked, on the audience landing, after the page's own questions passed as children), `ReaderContextAddress` (adopts `?country=…` from a link; never writes the address, which belongs to the router), and the sidebar's chip with a change button (each answer as its option's emoji flag and the dimension's short label, on one line). Pages and search results written for another context are dimmed with the reason, never removed |
| `components/docs-select` | `DocsSelect`: a labelled native select in the docs' look (chevron, token ring, an option's `flag` before its label), for the picker and a host's own questions |
| `components/code-panel`, `chip` | Every piece of code (one tab per variant, a copy button); the one chip (HTTP method, status, type) |
| `components/mdx/*` | `mdxComponents`: callouts, cards, steps, tabs, code groups, accordions, anchored headings, tables, `AudienceIndex` (an audience landing's countries, paths with the contexts they are written for, planned paths and list), `PathSteps` (a path page's steps), `CodeValue` (a value the host's code holds) and `OnlyFor` (a passage for some contexts: every variant labelled until the reader answers) |
| `components/api/*` | `ApiOverviewPage` and `ApiOperationPage` |
| `lib/theme-script`, `lib/messages`, `lib/country-flag` | `themeScript(storageKey)` for the head; the `DocsMessages` type; `countryFlag(code)`, an ISO country code's emoji flag |
| `lib/english-messages` | `englishMessages`, every `DocsMessages` word in plain English, for a site written in English to spread and override (`{ ...englishMessages, title: "Handbook" }`) |
| `lib/lazy-content` | `lazyContent(load)`: a page's compiled body as a lazy `Content` component and a `preloadContent` a route's loader awaits, so a prerendered page hydrates without swapping its body for the Suspense fallback |
| `styles/sources.css` | The `@source` lines Tailwind needs to generate the components' utilities, relative to the installed package |
| `styles/docs.css` | The frame's tokens (`bg-docs-canvas`, `text-docs-sm`, `text-docs-base`), the page's column widths (`docs-guide` 40rem, `docs-api` 38rem, `docs-toc` 16.5rem, `docs-examples` 30rem), Shiki's two themes, `docs-prose` and `docs-flow` |

A consumer wires it once:

```css
@import "tailwindcss";
@import "@voila.dev/ui-docs/styles/docs.css";
@import "@voila.dev/ui-docs/styles/sources.css";
```

(`@source "../node_modules/@voila.dev/ui-docs/dist"` works as well.)

```tsx
<DocsProvider Link={RouterLink} navigate={navigate} messages={messages}
	icons={icons} navigation={navigation} footer={footerNote}
	support={{ href: "mailto:help@example.com", label: "Write to us" }}
	audienceStorageKey="site:docs-audience" constants={constants}
	readerContext={{ storageKey: "site:docs-reader-context", dimensions, applicability }}>
	<DocsFrame brand={brand} actions={actions} menuLinks={links}
		themeStorageKey="site:docs-theme" loadSearchIndex={loadIndex}>
		{page}
	</DocsFrame>
</DocsProvider>
```

and puts `themeScript(storageKey)` in the docs route's head so the dark theme
applies before the first paint. The package never imports a router: links go
through the injected `Link`, and the search palette through `navigate`. The
host may hand pages of different languages different `messages`: an
English-only API reference can have English chrome beside guides in another
language.

## Theme

The components read the usual tokens a Tailwind theme declares
(`background`, `foreground`, `primary`, `muted-foreground`, `border`,
`popover`, `destructive` and their `-foreground`, `font-sans`, `font-mono`,
`font-heading`). `docs.css` adds its own, with defaults in light and dark,
which a host redefines after it to use its brand: `--docs-canvas`,
`--docs-shot-tint`, `--docs-info`, `--docs-success`, `--docs-warning`,
`--docs-caution` (each with a `-foreground`) and `--docs-bezel`.

## Starting a site

[`domains/docs/templates/docs-site`](https://github.com/voila-voila-dev/platform/tree/main/domains/docs/templates/docs-site)
is a whole site on these two packages (TanStack Start, prerendered, deployed
as static assets to Cloudflare Workers) to clone: one `docs.config.ts`, MDX
pages, a navigation file and a test that keeps the links sound.
