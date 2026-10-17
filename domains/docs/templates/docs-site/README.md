# Docs site template

A documentation site to clone, on [`@voila.dev/docs`](../../packages/docs)
and [`@voila.dev/ui-docs`](../../packages/ui-docs): TanStack Start, React 19
and Tailwind CSS 4, every page prerendered to a static file and served by a
Cloudflare Worker with no code of its own. Sidebar, search palette, outline,
"Copy page" for assistants, dark theme, an API reference from an OpenAPI
document, and a test that fails on a dead link.

[docs.voila.dev](https://docs.voila.dev) is this template with its own config
and content ([`domains/docs/apps/docs.voila.dev`](../../apps/docs.voila.dev)).

## Clone it

```sh
bunx degit voila-voila-dev/platform/domains/docs/templates/docs-site my-docs
cd my-docs
```

The template lives in the platform monorepo, where CI builds and tests it on
every change. Outside it, three files change:

1. `package.json`: replace `workspace:^` with the published versions of
   `@voila.dev/docs` and `@voila.dev/ui-docs`, rename the package, and drop
   every `--conditions=@voila.dev/source` (and the `NODE_OPTIONS=` before it)
   from the scripts.
2. `vite.config.ts`: delete `SOURCE_CONDITION` and the two `conditions`.
3. `tsconfig.json`: delete `customConditions`.

Then:

```sh
bun install
bun run dev        # http://localhost:4010
```

## Make it yours

Edit **`docs.config.ts`**, the one file the rest reads: the site's name and
address, where the docs and the API reference are served, the browser
storage keys, the frontmatter vocabulary (audiences, stages, landings), the
icons a page may name, the chrome's words (English by default), the brand,
the header links and the support contact.

The palette is in **`src/styles/globals.css`**: the usual tokens
(`--background`, `--foreground`, `--primary`…) and the docs' own `--docs-*`.
The logo is `public/favicon.svg`; the Worker's name is in `wrangler.jsonc`.

## Write pages

A page is an `.mdx` file under `src/content/docs`; its path is its address
(`guides/install.mdx` is `/guides/install`, an `index.mdx` its folder's).

```mdx
---
title: Install
description: Add the SDK to your project.
icon: rocket
audience: [everyone]
kind: guide
stage: start
next: [guides/first-request]
---

<Steps>
  <Step title="Add the package">…</Step>
</Steps>
```

List it once in `src/content/docs/navigation.ts`. Callouts, cards, steps,
tabs, code groups, accordions and screenshots need no import.

```sh
bun run test         # sidebar coverage, dead links, orphans, reachability
bun run check-types
```

The API reference comes from `src/content/openapi.json`: replace it with your
API's document (or write it there before the build). A site without an API
deletes that file, `src/docs/api-reference.ts`, `src/components/api-pages.tsx`
and `src/routes/api`, and passes `[]` as the API groups in `src/docs/site.ts`.

## Deploy

```sh
bun run build        # dist/client: every page, sitemap.xml, 404.html
bunx wrangler deploy
```

The Worker serves the files as they are and answers any other path with
`404.html` and a 404 status. Uncomment `routes` in `wrangler.jsonc` to serve it
on your domain.

## Layout

| Path | What it holds |
| --- | --- |
| `docs.config.ts` | Everything a site says about itself |
| `src/content/docs/` | The pages, `navigation.ts`, and `docs.test.ts` |
| `src/content/openapi.json` | The API the reference documents |
| `src/docs/` | Pages loaded from the MDX (`pages.ts`), the sidebar (`site.ts`), the search index, the frontmatter schema, the head tags |
| `src/components/` | The frame with the router's `Link` (`docs-layout.tsx`), a page (`docs-article.tsx`), the API pages, the 404 |
| `src/routes/` | `/`, every other page (`$`), `/api`, `/api/$tag/$operation` and `/404` |
| `vite/` | The build check that fails on a page that rendered with an error |
