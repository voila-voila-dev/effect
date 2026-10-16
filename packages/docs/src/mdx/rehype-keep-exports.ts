import type { Root } from "hast";

/** Drops the page's body and keeps its ESM (the frontmatter, headings and steps exports), so a module listing the pages carries no content. */
export function rehypeKeepExports() {
	return function transform(tree: Root) {
		tree.children = tree.children.filter((node) => node.type === "mdxjsEsm");
	};
}
