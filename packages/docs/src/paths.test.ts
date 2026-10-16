import { describe, expect, it } from "bun:test";

import { audienceIndex } from "./audience-index.ts";
import { internalLinksIn } from "./links.ts";
import { type DocsPath, hrefInPath, placeInPath } from "./paths.ts";

const firstInvoice: DocsPath = {
	id: "first-invoice",
	title: "From sign-up to first invoice",
	audience: "developers",
	page: "dev/first-invoice",
	steps: [
		{
			slug: "account/create",
			context: "Already have an account? Skip to step 2.",
		},
		{ slug: "dev/company" },
		{ slug: "dev/profile" },
	],
};

const migrating: DocsPath = {
	id: "migrating",
	title: "Moving from another tool",
	audience: "developers",
	page: "dev/migrating",
	steps: [{ slug: "account/create" }, { slug: "dev/profile" }],
};

describe("placeInPath", () => {
	it("follows the only path that holds the page", () => {
		expect(
			placeInPath({ paths: [firstInvoice, migrating], slug: "dev/company" }),
		).toEqual({
			path: firstInvoice,
			index: 1,
			previous: firstInvoice.steps[0],
			next: { slug: "dev/profile" },
		});
	});

	it("follows the path the URL names when several hold the page", () => {
		expect(
			placeInPath({
				paths: [firstInvoice, migrating],
				slug: "dev/profile",
				requested: "migrating",
			}),
		).toEqual({
			path: migrating,
			index: 1,
			previous: { slug: "account/create" },
		});
	});

	it("picks no path when several hold the page and none is named", () => {
		expect(
			placeInPath({ paths: [firstInvoice, migrating], slug: "account/create" }),
		).toBeUndefined();
	});

	it("ignores a named path that does not hold the page", () => {
		expect(
			placeInPath({
				paths: [firstInvoice, migrating],
				slug: "dev/company",
				requested: "migrating",
			})?.path.id,
		).toBe("first-invoice");
	});

	it("keeps the reader in the path through the query", () => {
		expect(hrefInPath("/docs/dev/profile", "migrating")).toBe(
			"/docs/dev/profile?path=migrating",
		);
	});
});

describe("audienceIndex", () => {
	it("lists the audience's paths, then its pages under the sidebar topics, without the landing, the path pages or the unlisted", () => {
		const pages = [
			{ slug: "dev", audience: ["developers"], kind: "reference" as const },
			{
				slug: "dev/payouts",
				audience: ["developers"],
				kind: "guide" as const,
			},
			{
				slug: "dev/profile",
				audience: ["developers"],
				kind: "guide" as const,
			},
			{
				slug: "dev/first-invoice",
				audience: ["developers"],
				kind: "path" as const,
			},
			{
				slug: "dev/unlisted",
				audience: ["developers"],
				kind: "guide" as const,
			},
			{
				slug: "teams/invite",
				audience: ["teams"],
				kind: "guide" as const,
			},
		];

		const index = audienceIndex({
			pages,
			paths: [firstInvoice, migrating],
			audience: "developers",
			topics: [
				{ label: "Get started", slugs: ["dev", "dev/first-invoice"] },
				{ label: "Profile", slugs: ["dev/profile"] },
				{ label: "Teams", slugs: ["teams/invite"] },
				{ label: "Payouts", slugs: ["dev/payouts"] },
			],
			landing: "dev",
		});

		expect(index.paths.map((path) => path.id)).toEqual([
			"first-invoice",
			"migrating",
		]);
		expect(
			index.topics.map((topic) => [
				topic.label,
				topic.pages.map((entry) => entry.slug),
			]),
		).toEqual([
			["Profile", ["dev/profile"]],
			["Payouts", ["dev/payouts"]],
		]);
	});
});

describe("internalLinksIn", () => {
	it("reads Markdown links and JSX hrefs, without query or fragment", () => {
		expect(
			internalLinksIn(
				'See [Invite](/docs/teams/invite#pricing) and <Card href="/docs/account?x=1" />, not [elsewhere](https://example.com).',
			),
		).toEqual(["/docs/teams/invite", "/docs/account"]);
	});
});
