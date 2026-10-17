// The vocabulary every filtered list speaks: a screen *declares* which fields
// are filterable (`FilterDefinition`), and the editor, the summary chips and the
// query layer all read the same declaration. Nothing here is domain-aware —
// labels and copy arrive once at the filter root (or a `Filter.Provider`) so
// the package stays free of translations.

import type * as React from "react";

/** One choice of a `select` filter. */
export type FilterOption = {
	readonly value: string;
	readonly label: string;
	/** Optional leading glyph (a status dot, a flag, an avatar). */
	readonly icon?: React.ReactNode;
	/**
	 * Kept behind a "more" toggle until expanded, so a long tail of rarely
	 * picked options doesn't drown the shortlist. A selected or search-matched
	 * secondary option always shows.
	 */
	readonly secondary?: boolean;
};

type BaseDefinition = {
	/** Identifies the filter in a `FilterValues` record and in the query. */
	readonly key: string;
	readonly label: string;
	/** One line under the label when the field needs explaining. */
	readonly description?: string;
	/**
	 * Rendered under the editor, fed the current (draft) value — for a live
	 * illustration of what the filter covers, e.g. a map previewing a radius.
	 * The package stays domain-agnostic; the screen supplies the rendering.
	 */
	readonly renderPreview?: (value: FilterValue | undefined) => React.ReactNode;
};

/**
 * Fields that can be inverted ("is not …") carry `allowExclusion`. Ranges and
 * booleans don't: "not between 10 and 20" reads worse than two range bounds,
 * and a tri-state boolean already covers its own negation.
 */
type ExcludableDefinition = BaseDefinition & {
	readonly allowExclusion?: boolean;
};

export type TextFilterDefinition = ExcludableDefinition & {
	readonly kind: "text";
	readonly placeholder?: string;
};

export type NumberFilterDefinition = BaseDefinition & {
	readonly kind: "number";
	readonly min?: number;
	readonly max?: number;
	readonly step?: number;
	/** Trailing unit shown inside the field (e.g. `km`, `%`). */
	readonly unit?: string;
};

export type NumberRangeFilterDefinition = BaseDefinition & {
	readonly kind: "numberRange";
	readonly min?: number;
	readonly max?: number;
	readonly step?: number;
	readonly unit?: string;
};

/** Amounts are integer minor units (cents), the platform's money representation. */
export type MoneyRangeFilterDefinition = BaseDefinition & {
	readonly kind: "moneyRange";
	readonly currency: string;
};

export type SelectFilterDefinition = ExcludableDefinition & {
	readonly kind: "select";
	readonly options: ReadonlyArray<FilterOption>;
	/** Allow several options at once; the value stays a list either way. */
	readonly multiple?: boolean;
};

/** A named window ("30 days") the range can be set to in one tap. */
export type DateRangePreset = {
	readonly label: string;
	/** `YYYY-MM-DD`; an open bound means "unbounded on that side". */
	readonly from?: string;
	readonly to?: string;
};

/** Bounds are `YYYY-MM-DD`, the value a native date input round-trips. */
export type DateRangeFilterDefinition = BaseDefinition & {
	readonly kind: "dateRange";
	readonly min?: string;
	readonly max?: string;
	/**
	 * Shortcuts offered above the two bounds. A dashboard reads its period far
	 * more often than it picks exact days, and the shortcut belongs in the
	 * filter editor with the range it sets rather than loose on the page.
	 */
	readonly presets?: ReadonlyArray<DateRangePreset>;
};

/** A geocoded place a `geoRadius` filter can centre on. */
export type PlaceSuggestion = {
	readonly id: string;
	readonly label: string;
	readonly latitude: number;
	readonly longitude: number;
};

/**
 * "Around here, within N km". The package geocodes nothing itself — the screen
 * supplies `searchPlaces`, so the same field works against any address
 * provider.
 */
export type GeoRadiusFilterDefinition = BaseDefinition & {
	readonly kind: "geoRadius";
	readonly searchPlaces: (
		query: string,
	) => Promise<ReadonlyArray<PlaceSuggestion>>;
	readonly minKm?: number;
	readonly maxKm?: number;
	readonly stepKm?: number;
	/** Radius applied when a place is first picked. */
	readonly defaultKm?: number;
};

/** One pickable record of an `entity` filter (a customer, a supplier…). */
export type EntityFilterOption = {
	readonly id: string;
	readonly label: string;
};

/**
 * "Is one of these records" — options come from a search-as-you-type lookup
 * instead of a fixed list, so the field scales to thousands of records. The
 * package queries nothing itself; the screen supplies `searchOptions`, keeping
 * the field domain-blind like `geoRadius`.
 */
export type EntityFilterDefinition = ExcludableDefinition & {
	readonly kind: "entity";
	readonly searchOptions: (
		query: string,
	) => Promise<ReadonlyArray<EntityFilterOption>>;
	/** Allow several records at once; the value stays a list either way. */
	readonly multiple?: boolean;
	readonly searchPlaceholder?: string;
};

export type BooleanFilterDefinition = BaseDefinition & {
	readonly kind: "boolean";
	/** Labels for the two set states; the third state is "any", i.e. unset. */
	readonly trueLabel: string;
	readonly falseLabel: string;
};

export type FilterDefinition =
	| TextFilterDefinition
	| NumberFilterDefinition
	| NumberRangeFilterDefinition
	| MoneyRangeFilterDefinition
	| SelectFilterDefinition
	| DateRangeFilterDefinition
	| GeoRadiusFilterDefinition
	| EntityFilterDefinition
	| BooleanFilterDefinition;

export type FilterKind = FilterDefinition["kind"];

export type TextFilterValue = {
	readonly kind: "text";
	readonly text: string;
	/** `true` renders and reads as "is not". */
	readonly excluded?: boolean;
};

export type NumberFilterValue = {
	readonly kind: "number";
	readonly number: number;
};

export type NumberRangeFilterValue = {
	readonly kind: "numberRange";
	readonly min?: number;
	readonly max?: number;
};

export type MoneyRangeFilterValue = {
	readonly kind: "moneyRange";
	/** Minor units (cents). */
	readonly min?: number;
	readonly max?: number;
};

export type SelectFilterValue = {
	readonly kind: "select";
	readonly values: ReadonlyArray<string>;
	readonly excluded?: boolean;
};

export type DateRangeFilterValue = {
	readonly kind: "dateRange";
	/** `YYYY-MM-DD`. */
	readonly from?: string;
	readonly to?: string;
};

export type GeoRadiusFilterValue = {
	readonly kind: "geoRadius";
	/** The chosen place, kept for the chip and for re-opening the editor. */
	readonly place: PlaceSuggestion;
	readonly radiusKm: number;
};

export type EntityFilterValue = {
	readonly kind: "entity";
	/** Id and label both kept, so the chip and a shared URL restore without a lookup. */
	readonly entities: ReadonlyArray<EntityFilterOption>;
	readonly excluded?: boolean;
};

export type BooleanFilterValue = {
	readonly kind: "boolean";
	readonly value: boolean;
};

export type FilterValue =
	| TextFilterValue
	| NumberFilterValue
	| NumberRangeFilterValue
	| MoneyRangeFilterValue
	| SelectFilterValue
	| DateRangeFilterValue
	| GeoRadiusFilterValue
	| EntityFilterValue
	| BooleanFilterValue;

/**
 * The applied filters, keyed by definition key. A key is absent when its filter
 * is unset — an empty value is never stored, so `Object.keys` is the active
 * count and the record round-trips to a query string unchanged.
 */
export type FilterValues = Readonly<Record<string, FilterValue>>;

/** Every string the package renders. Defaults are English; pass translations. */
export type FilterLabels = {
	readonly trigger: string;
	readonly title: string;
	readonly description?: string;
	/** Commits the draft of `Filter.Panel` (the `apply` mode of `Filter.Root`). */
	readonly apply: string;
	/** Empties one field. */
	readonly clear: string;
	/** Empties the whole panel. */
	readonly clearAll: string;
	/** @deprecated No part renders it anymore; kept so existing label sets still type-check. */
	readonly cancel?: string;
	readonly close: string;
	readonly search: string;
	readonly searchPlaceholder: string;
	/** Placeholder of the search box a long option list gets. */
	readonly optionSearchPlaceholder: string;
	/** Placeholder of the field-search box a long editor gets. */
	readonly filterSearchPlaceholder: string;
	/** Shown when the field search matches no filter. */
	readonly noFilterFound: string;
	/** Shown when an entity lookup returns nothing. */
	readonly entityNoResults: string;
	readonly is: string;
	readonly isNot: string;
	readonly from: string;
	readonly to: string;
	readonly min: string;
	readonly max: string;
	/**
	 * @deprecated The boolean field is two option pills now (tap the active one
	 * to release it); "any" is the empty selection and has no label of its own.
	 */
	readonly any?: string;
	readonly remove: string;
	/** Chip and field copy for a radius around a place, e.g. "30 km around Nantes". */
	readonly around: (place: string, kilometres: number) => string;
	readonly placePlaceholder: string;
	readonly placeNoResults: string;
	readonly radius: string;
	readonly changePlace: string;
	readonly activeCount: (count: number) => string;
	readonly resultCount: (count: number) => string;
	readonly selectedCount: (count: number) => string;
	/** Reveals the secondary options a select keeps folded, e.g. "12 more…". */
	readonly moreOptions: (count: number) => string;
	/** Folds the secondary options back. */
	readonly lessOptions: string;
};

export const defaultFilterLabels: FilterLabels = {
	trigger: "Filters",
	title: "Filters",
	description: undefined,
	apply: "Apply",
	clear: "Clear",
	clearAll: "Clear all",
	close: "Close",
	search: "Search",
	searchPlaceholder: "Search…",
	optionSearchPlaceholder: "Search options…",
	filterSearchPlaceholder: "Search filters…",
	noFilterFound: "No filter matches.",
	entityNoResults: "No results.",
	is: "is",
	isNot: "is not",
	from: "From",
	to: "To",
	min: "Min",
	max: "Max",
	remove: "Remove",
	around: (place, kilometres) => `${kilometres} km around ${place}`,
	placePlaceholder: "Town, address…",
	placeNoResults: "No place found.",
	radius: "Radius",
	changePlace: "Change",
	activeCount: (count) => `${count} active`,
	resultCount: (count) => `${count} results`,
	selectedCount: (count) => `${count} selected`,
	moreOptions: (count) => `${count} more…`,
	lessOptions: "Show less",
};
