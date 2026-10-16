import type { Plugin } from "vite";

const RAW_QUERY = /[?&]raw\b/u;
const META_QUERY = /[?&]meta\b/u;

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
 * would compile `page.mdx?raw` (the source the "copy page" action reads) and
 * `page.mdx?meta` as the whole page. The raw source stays a string, and
 * `?meta` goes to the compiler that keeps only the exports: the docs list
 * every page's frontmatter and headings, and load each body on its own.
 */
export function routeMdxQueries(compilers: {
	page: Plugin;
	meta: Plugin;
}): Plugin {
	const page = transformOf(compilers.page);
	const meta = transformOf(compilers.meta);
	return {
		...compilers.page,
		transform(code, id, options) {
			if (RAW_QUERY.test(id)) {
				return;
			}
			return META_QUERY.test(id)
				? meta.call(this, code, id, options)
				: page.call(this, code, id, options);
		},
	};
}
