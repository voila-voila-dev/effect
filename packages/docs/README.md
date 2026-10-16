# @voila.dev/docs

The framework-free half of a documentation site: TypeScript only, no React,
no copy, no app paths. A site declares its navigation, its audiences and what
it needs to know about a reader; this package resolves the sidebar, finds the
page a reader asks for, checks that every page is reachable and fresh, turns
an OpenAPI document into reference pages, and compiles MDX in Vite.
`@voila.dev/ui-docs` renders what it computes.

- **One navigation registry.** Tabs, audiences, groups and folders, written
  once; the sidebar, the previous and next links, the breadcrumb and the
  coverage check all read it.
- **Pages know who they are for.** The frontmatter names a page's audience,
  its kind and, when it differs by reader, the context it applies to (a
  country, a plan, a language). A page written for another context is dimmed
  with the reason, never hidden.
- **The docs are tested like code.** `checkDocsGraph` reports dead links,
  pages more than two clicks from their landing, orphans and sources not
  re-read in 180 days, so CI fails before a reader finds them.
- **The API reference comes from the contract.** An OpenAPI 3 document gives
  the operations, their schemas, request examples in cURL and `fetch`, and a
  Markdown export for assistants.

```sh
bun add @voila.dev/docs
```

| Module | What it holds |
| --- | --- |
| `navigation` | The sidebar registry type (`DocsNavigation`: tabs, the audiences a tab offers, groups, an audience's groups being its topics), `resolveNavigation` (slugs to pages, a page's `sidebarTitle` kept beside its title, each audience's landing), `locate` (tab, audience, group, folders, previous and next of a path), `groupTrail` (a group's audience then its label), `slugsOf` (a group's slugs, folders opened) and `navigationCoverage` (every page listed exactly once) |
| `slug`, `page`, `heading` | `docHref(root, slug)`, the frontmatter schema (`docFrontmatter(vocabulary)`: sidebarTitle, audience, kind (`path`, `guide`, `reference`, `explanation`), stage, prerequisites, next, sources, lastVerified, appliesTo, variants), the outline type |
| `reader-context` | The reader context: the dimensions a site declares (a closed list of values, the audiences asked, a query parameter), `contextMismatches` (why a page is not written for a reader; an unanswered dimension never rules one out), reading it back from storage or a link, `applicabilityProblems` for `appliesTo` |
| `coverage` | `contextCoverage` (for each full context of an audience, the paths and planned paths that answer it), `coverageTable` (the matrix printed in CI) and the `DocsPlannedPath` type |
| `paths` | A path (an ordered reading list for one persona) as data: `pathsThrough` (the paths that use a block), `placeInPath` (the step a reader is on, from `?path=`, a parameter the site may rename, or the only path holding the page) |
| `audience-index` | What an audience landing lists: its paths, then its pages under the sidebar topics (`navigationTopics`) |
| `links`, `graph` | `internalLinksIn` (the site links of an MDX source) and `checkDocsGraph`: dead links, pages more than two clicks from their landing, orphans, `lastVerified` past 150 days (warn) or 180 days (fail), path pages that are not of kind `path` |
| `search`, `search-index` | The accent- and typo-tolerant matcher with the site's synonym groups, and the builders of its entries (a page carries its audience and stage as chips) |
| `api-reference/*` | An OpenAPI 3 document parsed (`model`, `openapi-document`, `schema-node`), its navigation groups, request examples (JSON, cURL, `fetch`), a Markdown export and the example tokenizer |
| `mdx/plugin` | `docsMdx()`, the Vite plugin that compiles the `.mdx` pages: frontmatter, GFM, an id on every heading exported as `headings`, Shiki in a light and a dark theme |

A consumer imports a module by path (`@voila.dev/docs/navigation`), passes
its own docs root and labels, and adds `docsMdx()` to its Vite plugins:

```ts
import { docsMdx } from "@voila.dev/docs/mdx/plugin";

export default defineConfig({ plugins: [docsMdx(), react()] });
```

Every module but `mdx/*` bundles in a browser: the compilers stay behind the
Vite plugin, and the package structure test keeps it that way.
