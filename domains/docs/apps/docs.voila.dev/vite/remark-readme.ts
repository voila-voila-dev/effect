import { existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import type { Nodes, Root } from "mdast";

import {
	linkedOutPackages,
	PACKAGES_ROOT,
	REPOSITORY,
} from "../src/content/docs/packages.ts";

const REPOSITORY_ROOT = join(import.meta.dirname, "../../../../..");
/** `packages/<name>` (repository tooling) or `domains/<domain>/packages/<name>`. */
const PACKAGE_DIRECTORY = /^(?:domains\/[^/]+\/)?packages\/([^/]+)\/?$/u;

/** Where a link of a README goes on the site: a package's page, ui.voila.dev, or the file on GitHub. */
export function readmeLinkTarget(readme: string, href: string): string {
	if (/^([a-z]+:|#|\/)/u.test(href)) {
		return href;
	}
	const [path = "", fragment] = href.split("#");
	const target = relative(REPOSITORY_ROOT, join(dirname(readme), path));
	const suffix = fragment ? `#${fragment}` : "";
	const name = PACKAGE_DIRECTORY.exec(target)?.[1];
	if (name) {
		const linkedOut = linkedOutPackages[name];
		if (linkedOut) {
			return linkedOut;
		}
		if (existsSync(join(REPOSITORY_ROOT, target, "README.md"))) {
			return `${PACKAGES_ROOT}/${name}${suffix}`;
		}
	}
	const kind = /\.[a-z0-9]+$/iu.test(target) ? "blob" : "tree";
	return `${REPOSITORY}/${kind}/main/${target}${suffix}`;
}

function rewriteLinks(node: Nodes, readme: string): void {
	if (node.type === "link" || node.type === "definition") {
		node.url = readmeLinkTarget(readme, node.url);
	}
	if ("children" in node) {
		for (const child of node.children) {
			rewriteLinks(child, readme);
		}
	}
}

/**
 * A package README as a docs page: its `# @voila.dev/…` title goes (the page
 * header shows it), and its relative links, written for GitHub, point to the
 * package's page, to ui.voila.dev or to the file on GitHub. Other pages pass
 * through untouched.
 */
export function remarkReadme() {
	return (tree: Root, file: { path?: string }) => {
		const readme = file.path;
		if (!readme?.endsWith("/README.md")) {
			return;
		}
		const title = tree.children.findIndex(
			(node) => node.type === "heading" && node.depth === 1,
		);
		if (title !== -1) {
			tree.children.splice(title, 1);
		}
		rewriteLinks(tree, readme);
	};
}
