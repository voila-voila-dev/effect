import { describe, expect, it } from "vitest";
import {
	CLEARED_FILTER_SENTINEL,
	decodeFilterValues,
	encodeFilterValues,
} from "#/filter/lib/filter-url.ts";
import type { FilterDefinition, FilterValues } from "#/filter/types.ts";

const definitions: ReadonlyArray<FilterDefinition> = [
	{ kind: "text", key: "city", label: "City", allowExclusion: true },
	{ kind: "number", key: "radius", label: "Radius" },
	{ kind: "numberRange", key: "guests", label: "Guests" },
	{ kind: "moneyRange", key: "price", label: "Price", currency: "EUR" },
	{
		kind: "select",
		key: "status",
		label: "Status",
		multiple: true,
		allowExclusion: true,
		options: [
			{ value: "paid", label: "Paid" },
			{ value: "refunded", label: "Refunded" },
			{ value: "failed", label: "Failed" },
		],
	},
	{
		kind: "select",
		key: "kind",
		label: "Kind",
		options: [
			{ value: "one", label: "One" },
			{ value: "two", label: "Two" },
		],
	},
	{ kind: "dateRange", key: "createdAt", label: "Created" },
	{
		kind: "boolean",
		key: "verified",
		label: "Verified",
		trueLabel: "Yes",
		falseLabel: "No",
	},
	{
		kind: "geoRadius",
		key: "where",
		label: "Where",
		searchPlaces: () => Promise.resolve([]),
	},
	{
		kind: "entity",
		key: "org",
		label: "Organization",
		multiple: true,
		allowExclusion: true,
		searchOptions: () => Promise.resolve([]),
	},
];

function roundTrip(values: FilterValues): FilterValues {
	return decodeFilterValues(
		definitions,
		encodeFilterValues(definitions, values),
	);
}

describe("encodeFilterValues", () => {
	it("emits one readable param per active filter and nothing for empty records", () => {
		expect(encodeFilterValues(definitions, {})).toEqual({});
		expect(
			encodeFilterValues(definitions, {
				city: { kind: "text", text: "Nantes" },
				status: { kind: "select", values: ["paid", "refunded"] },
				price: { kind: "moneyRange", min: 1000 },
				verified: { kind: "boolean", value: true },
			}),
		).toEqual({
			city: "Nantes",
			status: "paid,refunded",
			price: "1000..",
			verified: "true",
		});
	});

	it("prefixes excluded values with a bang", () => {
		expect(
			encodeFilterValues(definitions, {
				city: { kind: "text", text: "Paris", excluded: true },
				status: { kind: "select", values: ["failed"], excluded: true },
			}),
		).toEqual({ city: "!Paris", status: "!failed" });
	});

	it("never emits an empty value", () => {
		expect(
			encodeFilterValues(definitions, {
				city: { kind: "text", text: "   " },
				status: { kind: "select", values: [] },
			}),
		).toEqual({});
	});
});

describe("round-trips", () => {
	it("keeps every kind intact", () => {
		const values: FilterValues = {
			city: { kind: "text", text: "Saint-Étienne", excluded: true },
			radius: { kind: "number", number: 30 },
			guests: { kind: "numberRange", min: 2, max: 10 },
			price: { kind: "moneyRange", max: 5000 },
			status: { kind: "select", values: ["paid", "failed"] },
			createdAt: { kind: "dateRange", from: "2026-01-01", to: "2026-06-30" },
			verified: { kind: "boolean", value: false },
			where: {
				kind: "geoRadius",
				place: {
					id: "47.218,-1.553",
					label: "Nantes",
					latitude: 47.218,
					longitude: -1.553,
				},
				radiusKm: 25,
			},
			org: {
				kind: "entity",
				entities: [
					{ id: "org_1", label: "FC Nantes" },
					{ id: "org_2", label: "Clinique Sud, Rezé" },
				],
			},
		};
		expect(roundTrip(values)).toEqual(values);
	});

	it("keeps open range bounds open", () => {
		expect(roundTrip({ guests: { kind: "numberRange", min: 2 } })).toEqual({
			guests: { kind: "numberRange", min: 2 },
		});
		expect(
			roundTrip({ createdAt: { kind: "dateRange", to: "2026-06-30" } }),
		).toEqual({
			createdAt: { kind: "dateRange", to: "2026-06-30" },
		});
	});

	it("survives entity labels carrying the codec's separators", () => {
		const values: FilterValues = {
			org: {
				kind: "entity",
				entities: [{ id: "org_1", label: "A~B, 100% C" }],
				excluded: true,
			},
		};
		expect(roundTrip(values)).toEqual(values);
	});
});

describe("decodeFilterValues", () => {
	it("drops junk instead of guessing", () => {
		expect(
			decodeFilterValues(definitions, {
				radius: "abc",
				guests: "1..2..3",
				price: "x..y",
				createdAt: "2026-13-99..",
				verified: "maybe",
				where: "30@nope@Nantes",
				org: "no-separator",
				unknown: "whatever",
				city: { nested: "object" },
			}),
		).toEqual({});
	});

	it("keeps only the known options of a select", () => {
		expect(decodeFilterValues(definitions, { status: "paid,bogus" })).toEqual({
			status: { kind: "select", values: ["paid"] },
		});
		expect(decodeFilterValues(definitions, { status: "bogus" })).toEqual({});
	});

	it("caps a single-choice select or entity at one value", () => {
		expect(decodeFilterValues(definitions, { kind: "one,two" })).toEqual({
			kind: { kind: "select", values: ["one"] },
		});
	});

	it("reads back values a JSON-parsing router already coerced", () => {
		// TanStack Router parses `?radius=30&verified=true` into a number and a
		// boolean before the codec ever sees them.
		expect(
			decodeFilterValues(definitions, { radius: 30, verified: true }),
		).toEqual({
			radius: { kind: "number", number: 30 },
			verified: { kind: "boolean", value: true },
		});
	});

	it("treats the cleared sentinel as no value", () => {
		expect(
			decodeFilterValues(definitions, { city: CLEARED_FILTER_SENTINEL }),
		).toEqual({});
	});
});
