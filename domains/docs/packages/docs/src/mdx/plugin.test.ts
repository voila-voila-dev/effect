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

	it("drops a page's imports from its ?meta, and keeps its exports", async () => {
		const transform = transformOf(docsMdx());
		const source =
			'---\ntitle: Button\n---\n\nimport * as Example from "./examples/button";\n\n<Example.Default />\n\n## Usage\n';

		const meta = await transform(source, "/site/button.mdx?meta");

		expect(meta?.code).not.toContain("./examples/button");
		expect(meta?.code).toContain("Button");
		expect(meta?.code).toContain('"usage"');
	});

	it("compiles ?text to the page's prose, code listings left out", async () => {
		const transform = transformOf(docsMdx());
		const source =
			'import { Note } from "./note";\n\n# Buttons\n\nA **button** starts an action.\n\n<Note>Use one per form.</Note>\n\n```ts\nconst hidden = true;\n```\n';

		const text = await transform(source, "/site/button.mdx?text");

		expect(text?.code).toContain(
			'"Buttons A button starts an action. Use one per form."',
		);
		expect(text?.code).not.toContain("hidden");
		expect(text?.code).not.toContain("./note");
	});

	it("leaves ?raw to Vite", async () => {
		const transform = transformOf(docsMdx());

		expect(await transform("# Title", "/site/page.mdx?raw")).toBeUndefined();
	});
});
