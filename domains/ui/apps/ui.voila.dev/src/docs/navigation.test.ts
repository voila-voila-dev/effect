import { describe, expect, it } from "bun:test";

import type { DocsTabConfig } from "../content/docs/sections.ts";
import { navigationOf, showcaseOf } from "./navigation.ts";

const tabs: ReadonlyArray<DocsTabConfig> = [
	{
		label: "UI",
		icon: "cube",
		sections: [
			{ label: "Start", dir: "start" },
			{
				label: "@voila.dev/ui",
				dir: "ui",
				categories: [
					{ id: "forms", label: "Forms" },
					{ id: "actions", label: "Actions" },
				],
				showcase: { order: 2, blurb: "Components." },
			},
		],
	},
	{
		label: "Chart",
		icon: "chart",
		sections: [
			{
				label: "chart",
				dir: "chart",
				showcase: { order: 1, blurb: "Charts." },
			},
		],
	},
];

const pages = [
	{ slug: "start/installation", title: "Installation", sidebar: { order: 2 } },
	{ slug: "start/introduction", title: "Introduction", sidebar: { order: 1 } },
	{ slug: "ui/quick-start", title: "Quick start" },
	{ slug: "ui/toggle", title: "Toggle", category: "actions" },
	{ slug: "ui/button", title: "Button", category: "actions" },
	{ slug: "ui/input", title: "Input", category: "forms" },
	{ slug: "chart/b", title: "B", sidebar: { order: 1 } },
	{ slug: "chart/a", title: "A", sidebar: { order: 1 } },
];

describe("navigationOf", () => {
	it("orders by number, then puts the intro above the categories, alphabetical inside each", () => {
		expect(navigationOf(tabs, pages)).toEqual([
			{
				label: "UI",
				icon: "cube",
				groups: [
					{
						label: "Start",
						pages: ["start/introduction", "start/installation"],
					},
					{ label: "@voila.dev/ui", pages: ["ui/quick-start"] },
					{ label: "Forms", pages: ["ui/input"] },
					{ label: "Actions", pages: ["ui/button", "ui/toggle"] },
				],
			},
			{
				label: "Chart",
				icon: "chart",
				groups: [{ label: "chart", pages: ["chart/a", "chart/b"] }],
			},
		]);
	});

	it("refuses a folder no section claims", () => {
		expect(() =>
			navigationOf(tabs, [...pages, { slug: "maps/globe", title: "Globe" }]),
		).toThrow("no section claims: maps");
	});

	it("refuses a page without its place in a section ordered by number", () => {
		expect(() =>
			navigationOf(tabs, [
				...pages,
				{ slug: "start/setup", title: "Setup", category: "forms" },
			]),
		).toThrow('start/setup.mdx — the "Start" section is ordered by number');
	});

	it("refuses an unknown category, a second intro and an empty category", () => {
		expect(() =>
			navigationOf(tabs, [
				...pages,
				{ slug: "ui/menu", title: "Menu", category: "overlays" },
			]),
		).toThrow('category "overlays" is not one of');
		expect(() =>
			navigationOf(tabs, [...pages, { slug: "ui/theming", title: "Theming" }]),
		).toThrow("ui has 2 pages with no category");
		expect(() =>
			navigationOf(
				tabs,
				pages.filter((page) => page.slug !== "ui/input"),
			),
		).toThrow('declares the "forms" category but no page uses it');
	});
});

describe("showcaseOf", () => {
	it("lists the showcased sections in their own order, linking to their first page", () => {
		const navigation = navigationOf(tabs, pages);
		expect(showcaseOf(tabs, navigation, (slug) => `/${slug}`)).toEqual([
			{ name: "chart", href: "/chart/a", blurb: "Charts." },
			{ name: "ui", href: "/ui/quick-start", blurb: "Components." },
		]);
	});
});
