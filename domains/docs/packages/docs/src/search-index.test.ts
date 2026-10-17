import { describe, expect, it } from "bun:test";

import { searchDocs } from "./search.ts";
import { pageSearchEntries } from "./search-index.ts";

const page = {
	title: "Button",
	description: "Starts an action.",
	href: "/ui/button",
	headings: [{ depth: 2 as const, id: "sizes", text: "Sizes" }],
};

describe("pageSearchEntries", () => {
	it("lists the page and each of its sections", () => {
		expect(pageSearchEntries(page, "Actions")).toEqual([
			{
				kind: "page",
				title: "Button",
				context: "Actions",
				href: "/ui/button",
				keywords: "Starts an action.",
			},
			{
				kind: "section",
				title: "Sizes",
				context: "Button",
				href: "/ui/button#sizes",
			},
		]);
	});

	it("finds a page by its prose when it carries it", () => {
		const withText = pageSearchEntries(
			{ ...page, text: "Pass loading to show a spinner while it waits." },
			"Actions",
		);
		const withoutText = pageSearchEntries(page, "Actions");

		expect(
			searchDocs(withText, "spinner").map((result) => result.href),
		).toEqual(["/ui/button"]);
		expect(searchDocs(withoutText, "spinner")).toEqual([]);
	});
});
