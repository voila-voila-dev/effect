const TITLE_IN_META = /title="([^"]+)"/u;
/**
 * Carries a fence's language and `title="…"` onto the `<pre>` so the code
 * block component can label its header, and drops Shiki's inline backgrounds
 * so the block takes the site's surface color.
 */
export const shikiCodeMeta = {
    name: "docs:code-meta",
    pre(node) {
        const title = this.options.meta?.__raw?.match(TITLE_IN_META)?.[1];
        node.properties["data-language"] = this.options.lang;
        if (title) {
            node.properties["data-title"] = title;
        }
        const style = node.properties.style;
        if (typeof style === "string") {
            node.properties.style = style.replace(/--shiki-(light|dark)-bg:[^;]+;?/gu, "");
        }
    },
};
