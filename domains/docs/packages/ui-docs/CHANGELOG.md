# @voila.dev/ui-docs

## 0.2.0

### Minor Changes

- e1909d3: Three exports for a site starting out: `lib/english-messages` (`englishMessages`, every `DocsMessages` word in English, to spread and override), `lib/lazy-content` (`lazyContent(load)`, a page body as a lazy component a route loader preloads so a prerendered page hydrates without a flash), and `styles/sources.css` (the `@source` lines Tailwind needs, relative to the installed package). Nothing existing changes.

### Patch Changes

- Updated dependencies [e1909d3]
  - @voila.dev/docs@0.2.0

## 0.1.0

### Minor Changes

- cd13934: First release: `@voila.dev/docs` holds the framework-free half of a documentation site (navigation registry, reader contexts, typo-tolerant search, a link graph check, an OpenAPI reference model and the MDX pipeline for Vite), and `@voila.dev/ui-docs` its React layer (frame, sidebar, outline, search palette, guide chrome, MDX components and API reference pages) on Tailwind CSS 4 and Base UI.

### Patch Changes

- Updated dependencies [cd13934]
  - @voila.dev/docs@0.1.0
