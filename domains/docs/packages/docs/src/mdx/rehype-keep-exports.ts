import type { Root, RootContent } from "hast";

/**
 * The ESM a node holds without its imports: a page that imports its examples
 * would otherwise drag them, and everything they import, into the module that
 * lists every page.
 */
function withoutImports(node: RootContent): Array<RootContent> {
	if (node.type !== "mdxjsEsm") {
		return [];
	}
	const program = node.data?.estree;
	if (!program) {
		return [node];
	}
	const body = program.body.filter(
		(statement) => statement.type !== "ImportDeclaration",
	);
	if (body.length === 0) {
		return [];
	}
	return [{ ...node, data: { ...node.data, estree: { ...program, body } } }];
}

/** Drops the page's body and its imports, and keeps its exports (the frontmatter, headings and steps), so a module listing the pages carries no content. */
export function rehypeKeepExports() {
	return function transform(tree: Root) {
		tree.children = tree.children.flatMap(withoutImports);
	};
}
