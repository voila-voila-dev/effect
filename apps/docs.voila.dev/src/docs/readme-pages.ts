import type { DocHeading } from "@voila.dev/docs/heading";
import { lazyContent } from "@voila.dev/ui-docs/lib/lazy-content";
import type { ComponentType } from "react";

import { PACKAGES_ROOT } from "../content/docs/packages.ts";
import type { DocContentProps, DocPage } from "./pages.ts";
import { frontmatterOf, pageHref } from "./vocabulary.ts";

// Every package README, read where it is: the page a reader sees is the README
// npm and GitHub show, compiled at build time. The packages ui.voila.dev
// documents and the private ones are left out (`content/docs/packages.ts`;
// Vite reads the patterns before the code runs, so they are spelled out).

const metas = import.meta.glob<{ headings: ReadonlyArray<DocHeading> }>(
	[
		"../../../../packages/*/README.md",
		"!**/packages/{ui,chart,motion,typescript-config,ui-branding}/README.md",
	],
	{ query: "?meta", eager: true },
);
const bodies = import.meta.glob<ComponentType<DocContentProps>>(
	[
		"../../../../packages/*/README.md",
		"!**/packages/{ui,chart,motion,typescript-config,ui-branding}/README.md",
	],
	{ import: "default" },
);
const sources = import.meta.glob<string>(
	[
		"../../../../packages/*/README.md",
		"!**/packages/{ui,chart,motion,typescript-config,ui-branding}/README.md",
	],
	{ query: "?raw", import: "default" },
);
const descriptions = import.meta.glob<string>(
	"../../../../packages/*/package.json",
	{ import: "description", eager: true },
);

const PACKAGE_OF = /packages\/([^/]+)\/README\.md$/u;

/** The page of each package README, at `/packages/<name>`, titled with its npm name and described by its package.json. */
export function readmePages(): Array<DocPage> {
	return Object.entries(metas).map(([path, meta]) => {
		const name = PACKAGE_OF.exec(path)?.[1];
		const body = bodies[path];
		const source = sources[path];
		if (!(name && body && source)) {
			throw new Error(`${path} was not compiled`);
		}
		const slug = `${PACKAGES_ROOT.slice(1)}/${name}`;
		return {
			...frontmatterOf(
				{
					title: `@voila.dev/${name}`,
					sidebarTitle: name,
					description:
						descriptions[path.replace(/README\.md$/u, "package.json")],
					audience: ["everyone"],
					kind: "reference",
					stage: "build",
				},
				`packages/${name}/README.md`,
			),
			slug,
			href: pageHref(slug),
			headings: meta.headings,
			...lazyContent(body),
			loadSource: source,
		};
	});
}
