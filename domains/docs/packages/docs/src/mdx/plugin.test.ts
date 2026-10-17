import { describe, expect, it } from "bun:test";
import type { Root } from "mdast";
import type { Plugin } from "vite";

import { docsMdx } from "./plugin.ts";

type Transform = (
	code: string,
	id: string,
) => Promise<{ code: string } | undefined>;

function transformOf(plugin: Plugin): Transform {
	const { transform } = plugin;
	if (typeof transform !== "function") {
		throw new Error("docsMdx has no transform function");
	}
	return (code, id) => transform.call({} as never, code, id) as never;
}

/** Drops the page's h1, as a site does with a README whose title its page header already shows. */
function remarkDropTitle() {
	return (tree: Root) => {
		tree.children = tree.children.filter(
			(node) => !(node.type === "heading" && node.depth === 1),
		);
	};
}

describe("docsMdx", () => {
	it("runs a site's remark plugins on the page and on its ?meta", async () => {
		const transform = transformOf(
			docsMdx({ remarkPlugins: [remarkDropTitle] }),
		);
		const source = "# Package\n\nIntro.\n\n## Install\n";

		const page = await transform(source, "/site/README.md");
		const meta = await transform(source, "/site/README.md?meta");

		expect(page?.code).not.toContain('"Package"');
		expect(page?.code).toContain('"Intro."');
		expect(meta?.code).toContain('"install"');
	});

	it("compiles a .md file as Markdown, where braces and angle brackets are text", async () => {
		const transform = transformOf(docsMdx());

		const page = await transform(
			"# Title\n\nA `Map<K, V>` holds {key: value} pairs <like this>.\n",
			"/site/README.md",
		);

		expect(page?.code).toContain("{key: value}");
	});

	it("leaves ?raw to Vite", async () => {
		const transform = transformOf(docsMdx());

		expect(await transform("# Title", "/site/page.mdx?raw")).toBeUndefined();
	});
});
