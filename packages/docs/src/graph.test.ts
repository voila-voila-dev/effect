import { describe, expect, it } from "bun:test";

import { checkDocsGraph, type GraphPage } from "./graph.ts";
import type { DocsPath } from "./paths.ts";

/** A fixture page; `listed: false` keeps it out of the sidebar topic its landing lists. */
type FixturePage = GraphPage & { listed: boolean };

function page(slug: string, fields: Partial<FixturePage> = {}): FixturePage {
	return {
		slug,
		href: slug === "index" ? "/docs" : `/docs/${slug}`,
		audience: ["teams"],
		kind: "guide",
		listed: true,
		prerequisites: [],
		next: [],
		links: [],
		...fields,
	};
}

function topicsOf(pages: ReadonlyArray<FixturePage>) {
	return [
		{
			label: "Guides",
			slugs: pages.filter((entry) => entry.listed).map((entry) => entry.slug),
		},
	];
}

const sound: Array<FixturePage> = [
	page("index", { audience: ["everyone"], kind: "explanation", listed: false }),
	page("teams", { kind: "reference", listed: false }),
	page("teams/create", { next: ["teams/invite"] }),
	page("teams/invite", { links: ["/docs/teams/create"] }),
	page("teams/first-invoice", { kind: "path" }),
];

const paths: Array<DocsPath> = [
	{
		id: "first-invoice",
		title: "From sign-up to first invoice",
		audience: "teams",
		page: "teams/first-invoice",
		steps: [{ slug: "teams/create" }, { slug: "teams/invite" }],
	},
];

function check(
	pages: ReadonlyArray<FixturePage>,
	fields: { paths?: Array<DocsPath> } = {},
) {
	return checkDocsGraph({
		pages,
		paths: fields.paths ?? paths,
		root: "index",
		landings: { everyone: "index", teams: "teams" },
		topics: topicsOf(pages),
		today: "2026-10-04",
	});
}

const clean = {
	deadLinks: [],
	unreachable: [],
	orphans: [],
	stale: [],
	aging: [],
	pathPages: [],
};

describe("checkDocsGraph", () => {
	it("passes a site where every page hangs off its landing", () => {
		expect(check(sound)).toEqual({
			...clean,
			orphans: ["teams"],
		});
	});

	it("reports an orphan: a page no topic lists that nothing links to", () => {
		const pages = [
			...sound.map((entry) =>
				entry.slug === "index" ? { ...entry, next: ["teams"] } : entry,
			),
			page("teams/forgotten", { listed: false }),
		];

		expect(check(pages)).toEqual({
			...clean,
			unreachable: [
				{
					slug: "teams/forgotten",
					audience: "teams",
					landing: "teams",
				},
			],
			orphans: ["teams/forgotten"],
		});
	});

	it("reports a dead link, a dead next step and a path step that does not exist", () => {
		const pages = sound.map((entry) =>
			entry.slug === "teams/invite"
				? {
						...entry,
						links: ["/docs/teams/gone"],
						next: ["teams/unknown"],
					}
				: entry,
		);
		const broken: DocsPath = {
			id: "broken",
			title: "Broken",
			audience: "teams",
			page: "teams/first-invoice",
			steps: [{ slug: "teams/missing" }],
		};

		expect(check(pages, { paths: [...paths, broken] }).deadLinks).toEqual([
			{
				from: "teams/invite",
				to: "/docs/teams/gone",
				via: "link",
			},
			{ from: "teams/invite", to: "teams/unknown", via: "next" },
			{ from: "broken", to: "teams/missing", via: "path" },
		]);
	});

	it("reports a variant for another context that does not exist", () => {
		const pages = sound.map((entry) =>
			entry.slug === "teams/create"
				? { ...entry, variants: ["teams/create-luxembourg"] }
				: entry,
		);

		expect(check(pages).deadLinks).toEqual([
			{
				from: "teams/create",
				to: "teams/create-luxembourg",
				via: "variants",
			},
		]);
	});

	it("fails a date checked more than 180 days ago and warns past 150", () => {
		const pages = [
			...sound,
			page("teams/taxes", { lastVerified: "2026-03-01" }),
			page("teams/vat", { lastVerified: "2026-04-20" }),
			page("teams/payroll", { lastVerified: "2026-09-01" }),
		];

		const report = check(pages);

		expect(report.stale).toEqual([
			{ slug: "teams/taxes", lastVerified: "2026-03-01", days: 217 },
		]);
		expect(report.aging).toEqual([
			{ slug: "teams/vat", lastVerified: "2026-04-20", days: 167 },
		]);
	});

	it("reports a page more than two clicks from its landing", () => {
		const pages = [
			page("index", { audience: ["everyone"], kind: "explanation" }),
			page("dev", { audience: ["developers"], kind: "reference" }),
			page("dev/a", {
				audience: ["developers"],
				listed: false,
				links: ["/docs/dev/b"],
			}),
			page("dev/b", {
				audience: ["developers"],
				listed: false,
				links: ["/docs/dev/c"],
			}),
			page("dev/c", { audience: ["developers"], listed: false }),
		].map((entry) =>
			entry.slug === "dev" ? { ...entry, links: ["/docs/dev/a"] } : entry,
		);

		const report = checkDocsGraph({
			pages,
			paths: [],
			root: "index",
			landings: { everyone: "index", developers: "dev" },
			topics: topicsOf(pages),
			today: "2026-10-04",
		});

		expect(report.unreachable).toEqual([
			{ slug: "dev/c", audience: "developers", landing: "dev" },
		]);
	});

	it("reports an audience without a landing", () => {
		const pages = [
			...sound,
			page("account/sign-in", { audience: ["account"] }),
		];

		expect(check(pages).unreachable).toEqual([
			{ slug: "account/sign-in", audience: "account", landing: undefined },
		]);
	});

	it("keeps path pages and pages of kind path in step", () => {
		const pages = sound.map((entry) =>
			entry.slug === "teams/first-invoice"
				? { ...entry, kind: "guide" as const }
				: entry,
		);

		expect(
			check([...pages, page("teams/alone", { kind: "path" })]).pathPages,
		).toEqual([
			{
				slug: "teams/first-invoice",
				problem: "path page is not of kind path",
			},
			{ slug: "teams/alone", problem: "page of kind path belongs to no path" },
		]);
	});
});
