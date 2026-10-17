---
"@voila.dev/ui": minor
---

`@voila.dev/ui/filter` gains a live-applying editor, a docked rail, an entity field and a URL codec.

- `Filter.Root` takes `mode="live"`: a real search input (`Filter.SearchInput`) beside a "Filters" button (`Filter.Button`), and a side sheet (`Filter.Sheet`) that applies each change as it happens — a tap at once, typing after 300 ms. `mode="apply"` (the default) is the existing draft-then-apply dialog.
- `Filter.Root` also takes `fullWidthTrigger`, `hideChips`, `open`/`onOpenChange` (drive the editor from outside) and `panelRenderedElsewhere` (the bar's button toggles a `Filter.Dock` you render beside the list).
- `Filter.Dock`: the live editor as a sticky rail on desktop, the `Filter.Sheet` drawer on mobile.
- `Filter.Provider`, `useFilterLabels`, `useFilterLocale`: copy and locale set once for every part below. Every part's `labels` is now an optional `Partial<FilterLabels>` and `locale` optional, both merged over the nearest provider (English defaults at the root) — passing a full label set as before still works.
- New `entity` filter kind ("is one of these records", search-as-you-type against your `searchOptions`), with `EntityFilterDefinition`, `EntityFilterOption`, `EntityFilterValue`.
- `encodeFilterValues` / `decodeFilterValues`, `RESERVED_LIST_PARAMS`, `CLEARED_FILTER_SENTINEL`: one readable query param per active filter, decoded defensively against the definitions.
- `dateRange` definitions take `presets` (`DateRangePreset`); `select` options take `secondary` (folded behind "N more…"); every definition takes `renderPreview(value)`.
- `FilterLabels` gains `filterSearchPlaceholder`, `noFilterFound`, `entityNoResults`, `moreOptions` and `lessOptions` (defaults in `defaultFilterLabels`).

Adjustments: the boolean field is now two option pills (tap the active one, or Clear, to unset) instead of a three-segment any/yes/no switch, so `labels.any` is unused and optional; `labels.cancel` was never rendered and is optional too. A complete `FilterLabels` object typed as such must add the five new keys. `Filter.Root`'s result count keeps its place in `apply` mode.
