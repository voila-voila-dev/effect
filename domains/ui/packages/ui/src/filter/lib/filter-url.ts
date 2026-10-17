// The query-string codec behind shareable list URLs: one param per active
// filter, encoded compactly enough to read in an address bar and decoded
// defensively enough that a stale bookmark can never break a screen. The
// definition — not the value — decides how a param is read, so a param whose
// filter changed kind (or disappeared) is simply dropped.
//
// Encodings, by kind:
//   text         `paris`, `!paris` (excluded)
//   number       `30`
//   numberRange  `10..20`, `10..`, `..20`
//   moneyRange   same, in minor units
//   select       `paid,refunded`, `!failed` (whole list excluded)
//   dateRange    `2026-01-01..2026-06-30`, open bounds allowed
//   boolean      `true` / `false`
//   geoRadius    `30@47.218,-1.553@Nantes`
//   entity       `id~label` comma list, `!` prefix excludes; labels escaped

import { isFilterValueEmpty } from "#/filter/lib/filter-values.ts";
import type {
	EntityFilterOption,
	FilterDefinition,
	FilterValue,
	FilterValues,
	PlaceSuggestion,
} from "#/filter/types.ts";

/**
 * Sibling params the list screen itself owns; a filter key must not collide
 * with them. Exported so the state hook and the codec agree on the split.
 */
export const RESERVED_LIST_PARAMS = ["q", "sort", "dir", "page"] as const;

/**
 * A screen may open with default facets (a queue showing only open rows). The
 * URL then needs to distinguish "unset, use the default" (key absent) from
 * "explicitly cleared" — this sentinel is the latter. The codec never emits
 * it; the state hook writes it and `decodeFilterValues` ignores it.
 */
export const CLEARED_FILTER_SENTINEL = "~";

const RANGE_SEPARATOR = "..";
const LIST_SEPARATOR = ",";
const EXCLUSION_PREFIX = "!";

/** `~` is unreserved in URLs, so it needs escaping by hand on top of `%`/`,`. */
function escapeEntityLabel(label: string): string {
	return encodeURIComponent(label).replaceAll("~", "%7E");
}

function unescapeEntityLabel(escaped: string): string | undefined {
	try {
		return decodeURIComponent(escaped);
	} catch {
		return undefined;
	}
}

function encodeBound(bound: number | string | undefined): string {
	return bound === undefined ? "" : String(bound);
}

/** A list is inverted by one leading bang, whatever the list holds. */
function withExclusion(list: string, excluded: boolean | undefined): string {
	return excluded === true ? `${EXCLUSION_PREFIX}${list}` : list;
}

function encodeRange(
	min: number | string | undefined,
	max: number | string | undefined,
): string {
	return `${encodeBound(min)}${RANGE_SEPARATOR}${encodeBound(max)}`;
}

/**
 * One writer per value kind. A table rather than a switch: the union has nine
 * arms, and the mapping stays exhaustive by type without a branch each.
 */
const ENCODERS: {
	[Kind in FilterValue["kind"]]: (
		value: Extract<FilterValue, { kind: Kind }>,
	) => string;
} = {
	text: (value) => withExclusion(value.text, value.excluded),
	number: (value) => String(value.number),
	numberRange: (value) => encodeRange(value.min, value.max),
	moneyRange: (value) => encodeRange(value.min, value.max),
	select: (value) =>
		withExclusion(value.values.join(LIST_SEPARATOR), value.excluded),
	dateRange: (value) => encodeRange(value.from, value.to),
	geoRadius: (value) =>
		`${value.radiusKm}@${value.place.latitude},${value.place.longitude}@${value.place.label}`,
	entity: (value) =>
		withExclusion(
			value.entities
				.map((entity) => `${entity.id}~${escapeEntityLabel(entity.label)}`)
				.join(LIST_SEPARATOR),
			value.excluded,
		),
	boolean: (value) => (value.value ? "true" : "false"),
};

function encodeFilterValue(value: FilterValue): string {
	return encodeOfKind(value.kind, value);
}

/** The table is keyed by the value's own discriminant; the generic kind pairs the two. */
function encodeOfKind<Kind extends FilterValue["kind"]>(
	kind: Kind,
	value: Extract<FilterValue, { kind: Kind }>,
): string {
	return ENCODERS[kind](value);
}

/**
 * The active filters as URL params, one entry per key. Empty values are never
 * emitted, so the record and the URL stay in the same "absent = unset" shape.
 */
export function encodeFilterValues(
	definitions: ReadonlyArray<FilterDefinition>,
	values: FilterValues,
): Record<string, string> {
	const params: Record<string, string> = {};
	for (const definition of definitions) {
		if (new Set<string>(RESERVED_LIST_PARAMS).has(definition.key)) {
			// A collision would make the filter and the list fight over one param;
			// surfaced in development, skipped in production.
			console.error(
				`Filter key "${definition.key}" collides with a reserved list param.`,
			);
			continue;
		}
		const value = values[definition.key];
		if (value === undefined || isFilterValueEmpty(value)) continue;
		params[definition.key] = encodeFilterValue(value);
	}
	return params;
}

function splitExclusion(raw: string): {
	readonly excluded: boolean;
	readonly rest: string;
} {
	return raw.startsWith(EXCLUSION_PREFIX)
		? { excluded: true, rest: raw.slice(EXCLUSION_PREFIX.length) }
		: { excluded: false, rest: raw };
}

function parseNumberBound(raw: string): number | undefined {
	if (raw === "") return undefined;
	const parsed = Number.parseFloat(raw);
	return Number.isFinite(parsed) ? parsed : undefined;
}

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;

function parseDayBound(raw: string): string | undefined {
	return DAY_PATTERN.test(raw) &&
		!Number.isNaN(new Date(`${raw}T00:00:00Z`).getTime())
		? raw
		: undefined;
}

/** `min..max` with open bounds; anything else (including `a..b..c`) is junk. */
function parseRange(raw: string): readonly [string, string] | undefined {
	const parts = raw.split(RANGE_SEPARATOR);
	return parts.length === 2 ? [parts[0] ?? "", parts[1] ?? ""] : undefined;
}

function decodeNumberRange(
	kind: "numberRange" | "moneyRange",
	raw: string,
): FilterValue | undefined {
	const parts = parseRange(raw);
	if (parts === undefined) return undefined;
	const min = parseNumberBound(parts[0]);
	const max = parseNumberBound(parts[1]);
	// A bound that was written but unreadable means the param is junk, not an
	// open bound — dropping the filter beats silently widening it.
	if (min === undefined && parts[0] !== "") return undefined;
	if (max === undefined && parts[1] !== "") return undefined;
	return { kind, min, max };
}

function decodeDateRange(raw: string): FilterValue | undefined {
	const parts = parseRange(raw);
	if (parts === undefined) return undefined;
	const from = parseDayBound(parts[0]);
	const to = parseDayBound(parts[1]);
	if (from === undefined && parts[0] !== "") return undefined;
	if (to === undefined && parts[1] !== "") return undefined;
	return { kind: "dateRange", from, to };
}

function decodeSelect(
	options: ReadonlyArray<{ readonly value: string }>,
	multiple: boolean,
	raw: string,
): FilterValue | undefined {
	const { excluded, rest } = splitExclusion(raw);
	const known = new Set(options.map((option) => option.value));
	const values = rest
		.split(LIST_SEPARATOR)
		.filter((candidate) => known.has(candidate));
	if (values.length === 0) return undefined;
	return {
		kind: "select",
		values: multiple ? values : values.slice(0, 1),
		...(excluded ? { excluded } : {}),
	};
}

/** `lat,lng` as a place, or nothing when either half is unreadable. */
function parsePlace(
	coordinates: string,
	label: string,
): PlaceSuggestion | undefined {
	const [rawLatitude, rawLongitude, ...rest] =
		coordinates.split(LIST_SEPARATOR);
	if (rest.length > 0 || label === "") return undefined;
	const latitude = parseNumberBound(rawLatitude ?? "");
	const longitude = parseNumberBound(rawLongitude ?? "");
	if (latitude === undefined || longitude === undefined) return undefined;
	// The id only keys the suggestion list on re-open; the coordinates are the
	// identity that matters, so they stand in for the provider's id.
	return { id: `${latitude},${longitude}`, label, latitude, longitude };
}

function decodeGeoRadius(raw: string): FilterValue | undefined {
	const [rawRadius, coordinates, ...labelParts] = raw.split("@");
	if (coordinates === undefined || labelParts.length !== 1) return undefined;
	const radiusKm = parseNumberBound(rawRadius ?? "");
	if (radiusKm === undefined || radiusKm <= 0) return undefined;
	const place = parsePlace(coordinates, labelParts[0] ?? "");
	return place === undefined
		? undefined
		: { kind: "geoRadius", place, radiusKm };
}

function parseEntity(part: string): EntityFilterOption | undefined {
	const separator = part.indexOf("~");
	if (separator <= 0) return undefined;
	const id = part.slice(0, separator);
	const label = unescapeEntityLabel(part.slice(separator + 1));
	return label === undefined || label === "" ? undefined : { id, label };
}

function decodeEntity(multiple: boolean, raw: string): FilterValue | undefined {
	const { excluded, rest } = splitExclusion(raw);
	const entities = rest
		.split(LIST_SEPARATOR)
		.map(parseEntity)
		.filter((entity): entity is EntityFilterOption => entity !== undefined);
	if (entities.length === 0) return undefined;
	return {
		kind: "entity",
		entities: multiple ? entities : entities.slice(0, 1),
		...(excluded ? { excluded } : {}),
	};
}

function decodeText(raw: string): FilterValue {
	const { excluded, rest } = splitExclusion(raw);
	return { kind: "text", text: rest, ...(excluded ? { excluded } : {}) };
}

function decodeNumber(raw: string): FilterValue | undefined {
	const parsed = parseNumberBound(raw);
	return parsed === undefined ? undefined : { kind: "number", number: parsed };
}

function decodeBoolean(raw: string): FilterValue | undefined {
	if (raw === "true") return { kind: "boolean", value: true };
	if (raw === "false") return { kind: "boolean", value: false };
	return undefined;
}

/**
 * One reader per declared kind. The definition decides how a param is read —
 * `select` needs its options, `entity` its arity — so the readers take the
 * definition rather than closing over it.
 */
const DECODERS: {
	[Kind in FilterDefinition["kind"]]: (
		definition: Extract<FilterDefinition, { kind: Kind }>,
		raw: string,
	) => FilterValue | undefined;
} = {
	text: (_definition, raw) => decodeText(raw),
	number: (_definition, raw) => decodeNumber(raw),
	numberRange: (_definition, raw) => decodeNumberRange("numberRange", raw),
	moneyRange: (_definition, raw) => decodeNumberRange("moneyRange", raw),
	select: (definition, raw) =>
		decodeSelect(definition.options, definition.multiple === true, raw),
	dateRange: (_definition, raw) => decodeDateRange(raw),
	geoRadius: (_definition, raw) => decodeGeoRadius(raw),
	entity: (definition, raw) => decodeEntity(definition.multiple === true, raw),
	boolean: (_definition, raw) => decodeBoolean(raw),
};

function decodeFilterValue(
	definition: FilterDefinition,
	raw: string,
): FilterValue | undefined {
	return decodeOfKind(definition.kind, definition, raw);
}

/** Total by construction, like {@link encodeOfKind}. */
function decodeOfKind<Kind extends FilterDefinition["kind"]>(
	kind: Kind,
	definition: Extract<FilterDefinition, { kind: Kind }>,
	raw: string,
): FilterValue | undefined {
	return DECODERS[kind](definition, raw);
}

/**
 * Routers that JSON-parse their query strings (TanStack does) hand `30` back
 * as a number and `true` as a boolean; the codec speaks strings, so those come
 * back to their spelling before decoding. Anything else non-string is junk.
 */
function coerceParam(raw: unknown): string | undefined {
	if (typeof raw === "string") return raw;
	if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
	if (typeof raw === "boolean") return String(raw);
	return undefined;
}

/**
 * The filters a URL carries, read against the screen's declarations. Unknown
 * keys, non-string values, unparsable payloads and cleared-sentinel entries
 * all decode to nothing — a shared link degrades to fewer filters, never to a
 * broken screen.
 */
export function decodeFilterValues(
	definitions: ReadonlyArray<FilterDefinition>,
	params: Readonly<Record<string, unknown>>,
): FilterValues {
	const values: Record<string, FilterValue> = {};
	for (const definition of definitions) {
		const raw = coerceParam(params[definition.key]);
		if (raw === undefined || raw === "") continue;
		if (raw === CLEARED_FILTER_SENTINEL) continue;
		const value = decodeFilterValue(definition, raw);
		if (value === undefined || isFilterValueEmpty(value)) continue;
		values[definition.key] = value;
	}
	return values;
}
