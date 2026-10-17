import type { Nodes, Root } from "hast";

import { constExport } from "./const-export.ts";

/** Where text is not prose: code listings, and the ESM and expressions of an MDX page. */
const SKIPPED = new Set([
	"mdxjsEsm",
	"mdxFlowExpression",
	"mdxTextExpression",
	"comment",
]);

function collect(node: Nodes, into: Array<string>): void {
	if (SKIPPED.has(node.type)) {
		return;
	}
	if (node.type === "element" && node.tagName === "pre") {
		return;
	}
	if (node.type === "text") {
		into.push(node.value);
		return;
	}
	if ("children" in node) {
		for (const child of node.children as Array<Nodes>) {
			collect(child, into);
		}
	}
}

/** A page's prose as one line of words, code listings left out, cut at `maxLength` characters. */
export function pageText(tree: Root, maxLength: number): string {
	const parts: Array<string> = [];
	collect(tree, parts);
	return parts.join(" ").replace(/\s+/gu, " ").trim().slice(0, maxLength);
}

/**
 * Replaces the page with `export const text`: its prose, for a search index
 * that matches a page on what it says and not only on its title and headings.
 */
export function rehypeExportText({ maxLength }: { maxLength: number }) {
	return function transform(tree: Root) {
		tree.children = [constExport("text", pageText(tree, maxLength))];
	};
}
