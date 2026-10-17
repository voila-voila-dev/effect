# @voila.dev/ui

## 6.1.0

### Minor Changes

- 0a743fa: `@voila.dev/ui/filter` gains a live-applying editor, a docked rail, an entity field and a URL codec.

  - `Filter.Root` takes `mode="live"`: a real search input (`Filter.SearchInput`) beside a "Filters" button (`Filter.Button`), and a side sheet (`Filter.Sheet`) that applies each change as it happens — a tap at once, typing after 300 ms. `mode="apply"` (the default) is the existing draft-then-apply dialog.
  - `Filter.Root` also takes `fullWidthTrigger`, `hideChips`, `open`/`onOpenChange` (drive the editor from outside) and `panelRenderedElsewhere` (the bar's button toggles a `Filter.Dock` you render beside the list).
  - `Filter.Dock`: the live editor as a sticky rail on desktop, the `Filter.Sheet` drawer on mobile.
  - `Filter.Provider`, `useFilterLabels`, `useFilterLocale`: copy and locale set once for every part below. Every part's `labels` is now an optional `Partial<FilterLabels>` and `locale` optional, both merged over the nearest provider (English defaults at the root) — passing a full label set as before still works.
  - New `entity` filter kind ("is one of these records", search-as-you-type against your `searchOptions`), with `EntityFilterDefinition`, `EntityFilterOption`, `EntityFilterValue`.
  - `encodeFilterValues` / `decodeFilterValues`, `RESERVED_LIST_PARAMS`, `CLEARED_FILTER_SENTINEL`: one readable query param per active filter, decoded defensively against the definitions.
  - `dateRange` definitions take `presets` (`DateRangePreset`); `select` options take `secondary` (folded behind "N more…"); every definition takes `renderPreview(value)`.
  - `FilterLabels` gains `filterSearchPlaceholder`, `noFilterFound`, `entityNoResults`, `moreOptions` and `lessOptions` (defaults in `defaultFilterLabels`).

  Adjustments: the boolean field is now two option pills (tap the active one, or Clear, to unset) instead of a three-segment any/yes/no switch, so `labels.any` is unused and optional; `labels.cancel` was never rendered and is optional too. A complete `FilterLabels` object typed as such must add the five new keys. `Filter.Root`'s result count keeps its place in `apply` mode.

- 52f617e: New subpaths: `audio-player` (a recording as a card — play, seek, skip, speed, download — plus `useAudioPlayback` to keep playing while the controls unmount), `select-field` (a select over resolved options with an optional "none" row, or a creatable combobox when `onCreate` is set) and `expanding-textarea-input` (multi-line text behind a one-line cell). `Chat` gains `Widget` and its parts, the thing a message is about under its bubble. `usePagination`, `getPaginationRange` and `PAGINATION_ELLIPSIS` are exported from `@voila.dev/ui/hooks`, and `useSpreadsheetColumnSizing` (widths remembered in `localStorage`) from `@voila.dev/ui/spreadsheet`, whose cells now flatten an `ExpandingTextareaInput`.

  Landing: `SiteHeader`'s mobile menu is a full-screen overlay that freezes the page behind it (`useScrollLock`, released by `styles/landing.css` past the breakpoint), closes when a link is followed, takes a controlled `open`/`onOpenChange`, and `collapseBelow="xl"` keeps the burger until `xl`. `ComparisonSection.BeforeAfter` builds both panels from four copy fields. `withArticleReaders` and `articleFigureNode` set content-editor readers for a long-form article (heading anchors, scrolling tables, captioned zoomable figures), styled by new `.article-anchor`, `.article-table` and `.article-progress` rules in `styles/landing.css`. `ProseArticle` is set for reading (a 40rem measure, 17/18 px at 1.65, near-black body text). Sections, intros, step tracks, testimonials, the hero, the CTA banner and comparisons are tighter on phones; `Section background="brand"` now uses `brand-foreground`, and `CtaBanner.Description` centres by default.

### Patch Changes

- 3d09dbf: The source moved from github.com/voila-voila-dev/ui to the voila-voila-dev/platform monorepo: `repository` and `bugs` now point there. The homepage stays https://ui.voila.dev, and the package names, exports and published layout are unchanged. Releases now go through Changesets instead of a version bump on every push.
- Updated dependencies [3d09dbf]
  - @voila.dev/motion@6.0.135

Since 6.0.135 releases go through Changesets in the voila-voila-dev/platform
monorepo, and every published version has its entry. Up to 6.0.134 versions
were `MAJOR.MINOR.<CI run number>`: every push to `main` of
voila-voila-dev/ui published, and the major moved by hand when a release broke
callers. The entries below record those moves — not every publish.

## 6.0 — the chart's tween is an import

A chart that animates on the default spring no longer loads the tween and
its easings, about 0.8 KB gzip of `@voila.dev/chart`'s `line` entry. The
tween moved from an `animate` object to a function you import.

### Breaking

| Was                                                                | Is                                                                                               |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `<Chart animate={{ type: "tween", duration, easing, stagger }} />` | `<Chart animate={tween({ duration, easing, stagger })} />`, `tween` from `@voila.dev/chart`      |
| `ChartTiming` with `type`, `duration`, `bounce`, `easing`          | `ChartTiming` is `{ stagger, motion(from, to, velocity) }`; the spring options are `ChartSpring` |

The spring forms (`true`, a number, `{ duration, bounce, stagger }`) are
unchanged. `@voila.dev/ui` and `@voila.dev/motion` move to 6.0 with the chart
and change nothing else.

## 5.0 — charts move to their own package

`@voila.dev/ui/chart` is gone. Charts are now
[`@voila.dev/chart`](https://ui.voila.dev/chart/quick-start): a chart is a
definition of marks passed to `<Chart>`, drawn to SVG or Canvas, every value
reachable from the keyboard. `@voila.dev/ui` 4.x keeps the old module for
callers that have not moved yet.

### Breaking

| Was                                                                                 | Is                                                                                              |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `import { Chart } from "@voila.dev/ui/chart"`                                       | `import { Chart } from "@voila.dev/chart/react"`, marks from `@voila.dev/chart`                 |
| `<Chart.Root config data x y>` with `<Chart.Bars />`, `<Chart.Line />`… as children | `<Chart definition={defineChart({ marks: [barY(data, { x, y })] })} ariaLabel />`               |
| `ChartConfig` (label and colour per key)                                            | the mark's `label` and `fill`/`stroke`, or `color: { domain, range, labels }` on the definition |
| `Chart.Tooltip`, `Chart.Legend`, `Chart.Cursor`                                     | built into `<Chart>`: `tooltip`, `legend`, focus and cursor                                     |
| `Chart.ReferenceLine value / category`                                              | `ruleY([value])`, `ruleX([category], { position: "before" })`                                   |
| `Chart.Bars projected`                                                              | `barY({ projected })`                                                                           |
| `Chart.LabelList`                                                                   | a `text` mark                                                                                   |
| `Chart.Empty`, `Chart.Skeleton`                                                     | `ChartEmpty`, `ChartSkeleton` from `@voila.dev/chart/react`                                     |
| `useChartContext()` and custom SVG children                                         | a mark (`ChartMark`), or two marks on two slices of the data                                    |

`@voila.dev/chart` versions move with the kit: 5.0 for both.

## 4.0 — the email block editor is removed

`@voila.dev/ui/email-block-editor` is gone. The content editor replaces it:
`createEmailFeatures()` edits the same fifteen blocks, with `appearance="email"`.
Its document is a Slate tree, so a stored `{ version, blocks }` document needs
one conversion; the worked converter is in
[email-block-editor → content-editor + createEmailFeatures](https://ui.voila.dev/ui-content-editor/migrating-from-the-block-editor).

### Breaking

| Was                                                                       | Is                                                                               |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `import { EmailBlockEditor } from "@voila.dev/ui/email-block-editor"`     | `ContentEditor` with `createEmailFeatures()` from `@voila.dev/ui/content-editor` |
| `EmailBlockEditor` props `blocks`, `document`, `onDocumentChange`         | `ContentEditor.Root` props `features`, `value`, `onValueChange`                  |
| `EmailEditorDocument`, `{ version: 1, blocks }`                           | `ContentValue`, a Slate tree; convert stored documents                           |
| `createEmailBlocks`, `createEmailBlockRegistry`, custom block definitions | `createEmailFeatures`, and a custom feature per block                            |
| the `grid` block                                                          | `columns` rows of `column`, one level deep                                       |
| peers `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`          | no longer needed by the kit                                                      |

## 3.1 — the content editor writes mails

The content editor can now write a one-to-one mail and a campaign email.
Nothing is removed: the email block editor still ships, and goes in 4.0.

Two presets, each an array of features like `createContentFeatures`:

```tsx
import {
  createCorrespondenceFeatures,
  createEmailFeatures,
} from "@voila.dev/ui/content-editor";
```

- `createCorrespondenceFeatures()` is a mail written by hand: paragraph,
  marks, link, list, quote, image and variable.
- `createEmailFeatures()` is a campaign: every block of the email block
  editor, as headings, highlight, fine print, button, stat, image, divider,
  article, product, offer, rating, table, columns and variable. Pair it with
  `appearance="email"`.

Each preset keeps a document to its own nodes. A node from outside the set,
pasted or stored, is unwrapped: a table pasted into a mail becomes one line
per cell.

## 3.0 — TanStack Table v9 and MapLibre 6

Two peer dependencies moved a major, and both reach the code you write.

TanStack Table v9 ships nothing by default: an API exists only when its
feature is registered. The data table registers its own set — sorting, global
search, an expandable row, selection, resizing, visibility, pinning — and
threads it through every generic, so a column definition names it.

```tsx
import {
  type ColumnDef,
  type DataTableFeatures,
} from "@voila.dev/ui/data-table";

const columns: ColumnDef<DataTableFeatures, Club>[] = [
  { accessorKey: "name", header: "Name" },
];
```

MapLibre 6 is ESM-only, needs WebGL2, and publishes no default export. It also
starts its tile worker from a URL relative to its own module, so a bundler must
leave it out of dependency pre-bundling — under Vite, a map that skips this
draws its raster relief and silently loses water, roads, borders and labels,
with nothing logged.

```ts title="vite.config.ts"
export default defineConfig({
  optimizeDeps: { exclude: ["maplibre-gl"] },
});
```

### Breaking

| Was                                           | Is                                                                                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| peer `@tanstack/react-table@^8`               | `^9` — [its own migration](https://tanstack.com/table/latest/docs/framework/react/guide/migrating) applies to your column definitions |
| peer `maplibre-gl@^5`                         | `^6` — ESM-only, WebGL2 required                                                                                                      |
| `import maplibregl from "maplibre-gl"`        | `import * as maplibregl from "maplibre-gl"`, or named imports                                                                         |
| `ColumnDef<Club>`, `Row<Club>`, `Table<Club>` | `ColumnDef<DataTableFeatures, Club>`, and so on — `DataTableFeatures` is exported from `@voila.dev/ui/data-table`                     |
| `DataTable.Root<Club, TValue>`                | `DataTable.Root<Club>` — one value type across a whole column list was never true, and v9 rejects it                                  |
| `columnPinning={{ left, right }}`             | `{{ start, end }}` — logical edges, so a pinned table follows the reading direction. Naming one edge is still enough                  |
| `VisibilityState`                             | `ColumnVisibilityState`                                                                                                               |
| a `TData` that is neither record nor array    | v9 constrains row data to `Record<string, any> \| Array<any>`                                                                         |
| Vite consumers                                | add `optimizeDeps.exclude: ["maplibre-gl"]`                                                                                           |

### Added

- **`DataTableFeatures`**, exported alongside the other data-table types, so a
  column definition can name the feature set without depending on TanStack
  directly.
- **RTL-aware pinning.** Frozen columns stick with `inset-inline-*` on
  TanStack's logical `start`/`end`, so the same table freezes the right columns
  under RTL instead of the mirrored ones.
- **Base UI 1.8**: `<Avatar.Image keepMounted>`, the combobox `createItems`
  collection API, and a `Select` popup that opens and browses while `readOnly`.
- MapLibre 6 draws Arabic and Hebrew labels correctly without an RTL plugin,
  and the other complex scripts along with them.

### Fixed

- **`Button` reads its own `render` tag.** `render={<a href>}` gets the button
  role and keyboard handling without `nativeButton={false}` at the call site. A
  component element still says nothing about its tag, so there the caller keeps
  the say.
- **`InputOTP` takes `defaultValue` quietly.** `input-otp` seeds its own state
  from the prop and forwards it to the inner input as well, next to the `value`
  already there; the root owns the uncontrolled case now, so React stops
  warning about an input that is both controlled and uncontrolled.
- **`CheckboxGroup` keeps a custom `id` in parent mode**, fixed upstream in
  Base UI 1.8 — an explicit `htmlFor`/`id` label pair holds, and the advice to
  wrap each box in its label is gone.

## 2.0 — the email editor is configurable

The email block editor was a package you forked. Its block set was a closed
union, its colours were module constants imported by 29 files, and around 240
English strings were spelled out in JSX. A host that needed a different block,
a different palette or a different language had one option, and took it.

Everything that used to be baked in is now something you pass in.

```tsx
const BLOCKS = createEmailBlocks({ currency: "EUR" });

<EmailBlockEditor
  blocks={BLOCKS}
  document={document}
  onDocumentChange={setDocument}
  theme={{ color: { brand: "#151b77" } }}
  labels={{ chrome: { addBlock: "Ajouter un bloc" } }}
/>;
```

### Breaking

| Was                                                                                                                                               | Is                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `<EmailBlockEditor onChange>`                                                                                                                     | `onDocumentChange`, and `blocks` is required                                                                                          |
| `EMAIL_BLOCK_DEFINITIONS`, `EMAIL_BLOCK_TYPES`, `EMAIL_LEAF_BLOCK_TYPES`, `emailBlockDefinition`                                                  | `createEmailBlocks()`, `createEmailBlockRegistry()`, `registry.definitionFor()`                                                       |
| `EMAIL_COLOR`, `EMAIL_FONT`, `EMAIL_HEADING_STYLE`, `EMAIL_GRID_GAP_PX`, `EMAIL_IMAGE_WIDTH_RATIO`, `EMAIL_PREVIEW_LOCALE`, `EMAIL_PREVIEW_WIDTH` | the `theme` prop, `DEFAULT_EMAIL_EDITOR_THEME`, `mergeEmailEditorTheme`                                                               |
| `createEmailEditorBlock(type, id)`                                                                                                                | `definition.createEmpty(id)`                                                                                                          |
| `createEmailEditorReducer(generateBlockId)`                                                                                                       | `createEmailEditorReducer(registry, generateBlockId)`                                                                                 |
| `EmailEditorBlock`, `EmailEditorLeafBlock`, `EmailEditorBlockType`                                                                                | `EmailEditorBuiltInBlock`, `EmailEditorBuiltInLeafBlock`, `EmailEditorBuiltInBlockType` — or your own union, via `EmailEditorBlockOf` |
| `EmailEditorCurrency` (`"EUR"`)                                                                                                                   | `EmailEditorMoney<Currency>`, fixed per instance by `createEmailBlocks({ currency })`                                                 |
| `formatPreviewPrice(money)`                                                                                                                       | `formatPreviewPrice(money, locale)`                                                                                                   |
| `EmailEditorDocument`                                                                                                                             | `EmailEditorDocument<Block>`, defaulting to the built-in union                                                                        |

### Added

- **`EmailEditor.*` parts.** `Root`, `Layout`, `Toolbar`, `Canvas`, `Card`,
  `CardHeader`, `CardFooter`, `Blocks`, `Sidebar`, `DocumentSettings`,
  `BlockSettings`, `SettingsSheet`. Every part renders a sensible default with
  no children; `EmailBlockEditor` is that composition, unchanged in spirit.
- **`labels`**, in four sections, merged over the English defaults section by
  section. A label that reads an index is a function, because `Item 3` and
  `3e élément` do not share a word order.
- **Controlled selection and preview** (`selectedBlockId`, `preview`), so a
  host with an undo stack can own them.
- **`documentSettings`**: fields belonging to the document rather than to a
  block — a subject line, a preheader — placed above the canvas when compact
  and at the top of the settings column when wide.
- **Containers are declared, not hard-coded.** A definition with a `container`
  holds other blocks; the grid is simply the one this package ships.
- **Hooks**: `useEmailEditor`, `useEmailEditorState`, `useEmailEditorActions`,
  `useEmailEditorTheme`, `useEmailEditorLabels`, `useEmailEditorRegistry`.
- The pieces a block of your own needs are exported: `BlockTextInput`,
  `RichTextEditable`, the option rows, the card shell.

### Fixed

- The fine print block edits spans like a paragraph but was missing from the
  rich-text set, so its toolbar had no bold, italic, underline or link.
- A stored block whose type an editor no longer registers shows an "unknown
  block" placeholder instead of crashing — the real path of a document that
  outlives a block someone removed.

### Migrating

1. Build your blocks once, outside the component:
   `const BLOCKS = createEmailBlocks({ currency: "EUR" })`.
2. Pass `blocks={BLOCKS}` and rename `onChange` to `onDocumentChange`.
3. Replace imports of `EMAIL_COLOR` / `EMAIL_FONT` with a `theme` prop, or
   with `DEFAULT_EMAIL_EDITOR_THEME` where you were painting your own card.
4. If you translated the editor by forking it, pass `labels` instead and
   delete the fork.
