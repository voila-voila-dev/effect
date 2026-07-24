# Writing component pages

The brief for the remaining `ui.voila.dev` pages. It is written to be handed to
someone (or something) that has not seen the earlier batches, so it repeats the
things that are easy to get wrong.

## What a page is

One page per component. **Short.** The component rendered, and the code to use
it. That is the whole contract.

No prop tables, no "when to use it" essays, no accessibility sections — those
were the old house style and they are being retired. If a component has one
genuinely surprising behaviour, one sentence under the code block is allowed.
Two sentences is the ceiling. Most pages should have none.

The Storybook is where variants live. The docs answer "what is this and how do
I import it", nothing more.

## The shape, exactly

```mdx
---
title: "Button"
description: "Trigger an action."
sidebar:
  order: 1
---

import Preview from "@/components/docs/preview";
import * as Example from "../../../examples/ui/button";

<Preview layout="stack">
	<Example.Default />
</Preview>

```tsx
<Button variant="outline">Save</Button>
```
```

That is a complete page. Copy it.

## Five things that will break the build

These are not hypothetical — each one cost a build during the earlier batches.

1. **Quote every frontmatter string.** `description: The core: 80 components`
   is invalid YAML the moment it contains a colon. Always
   `description: "…"`, always `title: "…"`.

2. **The relative depth for examples is `../../../`.** Pages live at
   `src/content/docs/<package>/<slug>.mdx`, which is three levels below `src`.
   `../../` resolves to nothing and the build fails with `Could not resolve`.
   `Preview` itself imports via the `@/` alias, so that line is always the same.

3. **`Preview` is a plain React component** (`@/components/docs/preview`); the
   examples inside it are ordinary React children. There are no Astro island
   directives any more — a leftover `client:load` will fail the MDX compile.

4. **One example module per package**, at
   `src/examples/<package>/<name>.tsx`, exporting one component per page. Do not
   create a file per component — 80 two-line files is not better than one file
   with 80 exports.

5. **The package must be a dependency of `apps/ui.voila.dev`** and imported in
   `src/styles/docs.css` (`@import "@voila.dev/<pkg>/styles.css";`), or the
   preview renders unstyled. Every package declares its own Tailwind sources, so
   there is never an `@source` path to write.

## Getting the examples right

**Derive every example from the package's Storybook story.** Do not write an
example from what the props *look* like they should be — the stories are
known-correct and already compile.

```
apps/storybook.ui.voila.dev/src/stories/<component>.stories.tsx
```

Take the simplest story (usually `Default`), strip the CSF wrapper, and export
it as a plain component. If a component has no story, read its props off the
source before writing anything.

Examples should be **self-contained and small**: a handful of rows, three
options, one sensible piece of state. They render in a boxed preview a few
hundred pixels wide.

`bun run check-types` catches a wrong prop immediately. Run it before moving to
the next package — not after writing forty pages.

## `Preview` options

| Prop | |
| --- | --- |
| `layout="row"` | default; examples wrap inline. Good for buttons, badges, chips. |
| `layout="stack"` | each example full width. Good for tables, forms, sections. |
| `layout="center"` | centred. Good for a single card or dialog trigger. |
| `label` | short caption above the example. Use sparingly — one example per page rarely needs one. |
| `scroll` | let a wide example scroll inside the frame instead of the page. |

## Ordering and naming

`sidebar.order` controls position; ties fall back to title. Conventions in use:

- `0` — the package's `quick-start.mdx` (label `Quick start`).
- `1`–`9` — the headline components, most important first.
- `10`+ — the long tail, grouped by kind (e.g. all the chart marks together,
  all the filter fields together).

`title` is the component's exported name (`FilterBar`, `Chart.Root`,
`Spreadsheet`), except where a page documents a *feature* rather than a
component — then it is a plain noun phrase (`Column pinning`, `CSV export`).

## What still needs writing

Nothing. Every package has a page per component:

| Package | Pages | Example module |
| --- | --- | --- |
| `@voila.dev/ui` | 85 components in `src/components/ui/` | `examples/ui/{forms,overlays,display,navigation,feedback}.tsx` |
| `@voila.dev/ui-landing` | 23 sections in `src/components/` | `examples/ui-landing/sections.tsx` |
| `@voila.dev/ui-email-block-editor` | 13 blocks in `src/blocks/` | `examples/ui-email-block-editor/blocks.tsx` |
| `@voila.dev/ui-icon` | `Icon` | `examples/ui-icon/icons.tsx` |

The `ui` example modules are split by theme rather than one enormous file. The
sidebar is a flat list ordered by `sidebar.order`, grouped by the same themes —
the search box carries most of the load.

For `ui-landing` and `ui-email-block-editor` the unit is a **section** or a
**block**, not the underlying primitive: one page for `LandingHero`, one for
`FeatureGrid`, one for `ButtonBlock`, and so on.

Two pages predate the current house style and are still in the old long form
with prop tables: `ui/button.mdx` and `ui/badge.mdx`. They need trimming to the
shape at the top of this file.

## Tone

The prose that does exist should sound like a colleague explaining the thing,
not like marketing and not like a spec. Plain sentences. No em dashes in
user-facing copy. British-ish spelling is what the existing pages use
(`colour`, `localise`) — match it.

Do not write "simply", "just", "easily", or "powerful".

## Before you call a package done

```sh
bun run check-types              # the examples compile
bun run --filter @voila.dev/ui.voila.dev build   # every page resolves
```

Then open the package's section in the browser and look at every preview. A
page that builds can still render an empty box, and the build will not tell you.
