import { toString as textOf } from "hast-util-to-string";
import { visit } from "unist-util-visit";
import { constExport } from "./const-export.ts";
const DEPTH_OF_TAG = {
    h2: 2,
    h3: 3,
};
function headingOf(element) {
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
    return function transform(tree) {
        const headings = [];
        visit(tree, "element", (element) => {
            const heading = headingOf(element);
            if (heading) {
                headings.push(heading);
            }
        });
        tree.children.unshift(constExport("headings", headings));
    };
}
