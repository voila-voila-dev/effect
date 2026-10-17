import type { Plugin } from "vite";

const RAW_QUERY = /[?&]raw\b/u;
const META_QUERY = /[?&]meta\b/u;
const TEXT_QUERY = /[?&]text\b/u;

type Transform = Extract<
	Plugin["transform"],
	(...args: Array<never>) => unknown
>;

function transformOf(plugin: Plugin): Transform {
	const { transform } = plugin;
	if (typeof transform !== "function") {
		throw new Error(`${plugin.name} has no transform function`);
	}
	return transform;
}

/**
 * @mdx-js/rollup drops the query before matching an id, so on its own it
 * would compile `page.mdx?raw` (the source the "copy page" action reads),
 * `page.mdx?meta` and `page.mdx?text` as the whole page. The raw source stays
 * a string, `?meta` goes to the compiler that keeps only the exports (the docs
 * list every page's frontmatter and headings, and load each body on its own),
 * and `?text` to the one that keeps only the prose, for the search index.
 */
export function routeMdxQueries(compilers: {
	page: Plugin;
	meta: Plugin;
	text: Plugin;
}): Plugin {
	const page = transformOf(compilers.page);
	const meta = transformOf(compilers.meta);
	const text = transformOf(compilers.text);
	return {
		...compilers.page,
		transform(code, id, options) {
			if (RAW_QUERY.test(id)) {
				return;
			}
			if (META_QUERY.test(id)) {
				return meta.call(this, code, id, options);
			}
			return TEXT_QUERY.test(id)
				? text.call(this, code, id, options)
				: page.call(this, code, id, options);
		},
	};
}
