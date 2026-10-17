import { toString as textOf } from "hast-util-to-string";
import { SKIP, visit } from "unist-util-visit";
import { constExport } from "./const-export.ts";
function isElementNamed(name) {
    return function test(node) {
        return (typeof node === "object" &&
            node !== null &&
            "type" in node &&
            node.type === "mdxJsxFlowElement" &&
            "name" in node &&
            node.name === name);
    };
}
const isSteps = isElementNamed("Steps");
const isStep = isElementNamed("Step");
function titleOf(step) {
    const title = step.attributes.find((attribute) => attribute.type === "mdxJsxAttribute" && attribute.name === "title")?.value;
    return typeof title === "string" ? title : undefined;
}
function stepOf(step) {
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
    return function transform(tree) {
        let steps = [];
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
