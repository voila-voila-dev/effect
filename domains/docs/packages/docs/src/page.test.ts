import { describe, expect, it } from "bun:test";
import { z } from "zod";

import { docFrontmatter } from "./page.ts";

const schema = docFrontmatter({
	icons: ["book"],
	audiences: ["account", "developers", "teams"],
	stages: ["setup", "offboarding"],
	dimensions: {
		country: {
			values: ["FR", "LU"],
			audiences: ["teams", "developers"],
			queryParameter: "country",
		},
		language: {
			values: ["en", "other"],
			audiences: ["developers"],
			queryParameter: "language",
		},
	},
});

const valid = {
	title: "Create your account",
	description: "An email address and a code.",
	audience: ["account"],
	kind: "guide",
	stage: "setup",
};

function errorsOf(input: unknown): string {
	const parsed = schema.safeParse(input);
	return parsed.success ? "" : z.prettifyError(parsed.error);
}

describe("docFrontmatter", () => {
	it("fills the optional lists of a minimal page", () => {
		expect(schema.parse(valid)).toEqual({
			...valid,
			audience: ["account"],
			kind: "guide",
			stage: "setup",
			prerequisites: [],
			next: [],
			sources: [],
			variants: [],
		});
	});

	it("names the audiences when a page declares none", () => {
		const { audience: _, ...page } = valid;

		expect(errorsOf(page)).toBe(
			"✖ audience (one or more of account, developers, teams) is required\n  → at audience",
		);
	});

	it("names the kinds when a page declares none", () => {
		const { kind: _, ...page } = valid;

		expect(errorsOf(page)).toBe(
			"✖ kind (one of path, guide, reference, explanation) is required\n  → at kind",
		);
	});

	it("refuses sources without the day they were checked", () => {
		expect(
			errorsOf({
				...valid,
				sources: [{ label: "Tax office", href: "https://www.example.gov" }],
			}),
		).toBe(
			"✖ lastVerified (YYYY-MM-DD) is required when the page cites sources\n  → at lastVerified",
		);
	});

	it("refuses an audience the site does not declare", () => {
		expect(errorsOf({ ...valid, audience: ["visitor"] })).toBe(
			'✖ Invalid option: expected one of "account"|"developers"|"teams"\n  → at audience[0]',
		);
	});

	it("refuses more than three next steps and a slug written as a URL", () => {
		expect(
			errorsOf({
				...valid,
				next: ["a", "b", "c", "d"],
				prerequisites: ["/docs/account/sign-in"],
			}),
		).toBe(
			"✖ Too big: expected array to have <=3 items\n  → at next\n✖ a slug is a page's path under its locale folder, without `.mdx`\n  → at prerequisites[0]",
		);
	});

	it("refuses paths, which the registry computes", () => {
		expect(errorsOf({ ...valid, paths: ["first-invoice"] })).toBe(
			'✖ Unrecognized key: "paths"',
		);
	});

	it("refuses an applicability on an unknown dimension or value", () => {
		expect(
			errorsOf({
				...valid,
				audience: ["developers"],
				appliesTo: { country: ["BE"], theme: ["dark"] },
			}),
		).toBe(
			"✖ BE is not a value (one of FR, LU)\n  → at appliesTo.country\n✖ unknown dimension (one of country, language)\n  → at appliesTo.theme",
		);
	});

	it("refuses a language on a page no developer reads", () => {
		expect(
			errorsOf({
				...valid,
				audience: ["teams"],
				appliesTo: { language: ["en"] },
			}),
		).toBe("✖ only concerns developers pages\n  → at appliesTo.language");
	});

	it("validates a site's own fields beside the shared ones", () => {
		const extended = docFrontmatter(
			{ icons: ["book"], audiences: ["everyone"], stages: ["build"] },
			{
				extend: {
					category: z.string().min(1).optional(),
					sidebar: z.strictObject({ order: z.number().int() }).optional(),
				},
			},
		);
		const page = {
			title: "Button",
			description: "A button.",
			audience: ["everyone"],
			kind: "reference",
		};

		const parsed = extended.parse({
			...page,
			category: "actions",
			sidebar: { order: 2 },
		});
		expect(parsed.category).toBe("actions");
		expect(parsed.sidebar).toEqual({ order: 2 });
		expect(
			extended.safeParse({ ...page, sidebar: { order: "2" } }).success,
		).toBe(false);
		expect(extended.safeParse({ ...page, categroy: "actions" }).success).toBe(
			false,
		);
	});

	it("keeps an applicability a page declares rightly", () => {
		const appliesTo = { country: ["FR"], language: ["other"] };

		expect(
			schema.parse({
				...valid,
				audience: ["developers"],
				kind: "path",
				appliesTo,
			}).appliesTo,
		).toEqual(appliesTo);
	});
});
