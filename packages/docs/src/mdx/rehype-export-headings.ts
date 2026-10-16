import type { Element, Root } from "hast";
import { toString as textOf } from "hast-util-to-string";
import { visit } from "unist-util-visit";

import type { DocHeading } from "../heading.ts";
import { constExport } from "./const-export.ts";

const DEPTH_OF_TAG: Readonly<Record<string, DocHeading["depth"]>> = {
	h2: 2,
	h3: 3,
};

function headingOf(element: Element): DocHeading | undefined {
	const depth = DEPTH_OF_TAG[element.tagName];
	const id = element.properties.id;
	if (depth === undefined || typeof id !== "string") {
		return undefined;
	}
	return { depth, id, text: textOf(element).trim() };
}

/**
 * Exports `headings` from every MDX module: the "On this page" outline and
 * the search index read them without rendering the page. Runs after
 * rehype-slug, which gives each heading its id.
 */
export function rehypeExportHeadings() {
	return function transform(tree: Root) {
		const headings: Array<DocHeading> = [];
		visit(tree, "element", (element) => {
			const heading = headingOf(element);
			if (heading) {
				headings.push(heading);
			}
		});
		tree.children.unshift(constExport("headings", headings));
	};
}
