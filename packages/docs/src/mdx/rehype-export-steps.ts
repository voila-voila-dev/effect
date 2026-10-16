import type { Root } from "hast";
import { toString as textOf } from "hast-util-to-string";
import type { MdxJsxFlowElementHast } from "mdast-util-mdx-jsx";
import { SKIP, visit } from "unist-util-visit";

import type { DocStep } from "../step.ts";
import { constExport } from "./const-export.ts";

function isElementNamed(name: string) {
	return function test(node: unknown): node is MdxJsxFlowElementHast {
		return (
			typeof node === "object" &&
			node !== null &&
			"type" in node &&
			node.type === "mdxJsxFlowElement" &&
			"name" in node &&
			node.name === name
		);
	};
}

const isSteps = isElementNamed("Steps");
const isStep = isElementNamed("Step");

function titleOf(step: MdxJsxFlowElementHast): string | undefined {
	const title = step.attributes.find(
		(attribute) =>
			attribute.type === "mdxJsxAttribute" && attribute.name === "title",
	)?.value;
	return typeof title === "string" ? title : undefined;
}

function stepOf(step: MdxJsxFlowElementHast): Array<DocStep> {
	const name = titleOf(step);
	if (name === undefined) {
		return [];
	}
	return [{ name, text: textOf(step).replace(/\s+/gu, " ").trim() }];
}

/**
 * Exports `steps` from every MDX module: the steps of its first `<Steps>`,
 * the procedure a guide walks through. A later `<Steps>` is a side
 * procedure, so the page's `HowTo` never mixes two.
 */
export function rehypeExportSteps() {
	return function transform(tree: Root) {
		let steps: Array<DocStep> = [];
		visit(tree, (node) => {
			if (!isSteps(node)) {
				return;
			}
			steps = node.children.filter(isStep).flatMap(stepOf);
			return steps.length > 0 ? false : SKIP;
		});
		tree.children.unshift(constExport("steps", steps));
	};
}
