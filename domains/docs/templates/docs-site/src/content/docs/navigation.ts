import type { DocsNavigation } from "@voila.dev/docs/navigation";

import type { docsConfig } from "../../../docs.config.ts";

type IconName = keyof typeof docsConfig.icons;

/**
 * The sidebar: its tabs, their groups, and the pages of `src/content/docs`
 * they list by slug (the path without `.mdx`). Every page is listed exactly
 * once; `docs.test.ts` fails the build otherwise. A group can hold a folder
 * (`{ label, pages }`) the sidebar collapses.
 */
export const docsNavigation = [
	{
		label: "Guides",
		icon: "book",
		groups: [
			{ label: "Get started", pages: ["index", "guides/quickstart"] },
			{
				label: "Write and ship",
				pages: ["guides/writing-pages", "guides/deploying"],
			},
		],
	},
	{ label: "API reference", icon: "code", apiReference: true },
] as const satisfies DocsNavigation<IconName>;
