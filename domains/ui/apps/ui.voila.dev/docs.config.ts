/**
 * ui.voila.dev, on `@voila.dev/docs` and `@voila.dev/ui-docs` in the shape of
 * `domains/docs/templates/docs-site`: this file, the sections
 * (`src/content/docs/sections.ts`), the pages and their live examples are what
 * differ. The home page is its own route, outside the docs frame.
 */
import {
	BrowserIcon,
	ChartBarIcon,
	CubeIcon,
	FunnelIcon,
	GridNineIcon,
	type Icon,
	MapTrifoldIcon,
	PencilLineIcon,
	TableIcon,
	WaveSineIcon,
} from "@phosphor-icons/react";
import type { DocsMessages } from "@voila.dev/ui-docs/lib/messages";

export const docsConfig = {
	name: "ui.voila.dev",
	description:
		"A source-shipped React + Tailwind component system. Copy it, install it, rebrand it — from buttons to a full email editor, it's yours.",
	url: "https://ui.voila.dev",
	language: "en",

	docsRoot: "/",

	storageKeys: {
		// The key the site has always kept the reader's light or dark choice
		// under, so a returning reader keeps theirs.
		theme: "theme",
		audience: "ui-docs:audience",
		readerContext: "ui-docs:reader-context",
	},

	vocabulary: {
		audiences: ["everyone"],
		stages: ["start", "build"],
	},

	icons: {
		chart: ChartBarIcon,
		cube: CubeIcon,
		editor: PencilLineIcon,
		filter: FunnelIcon,
		grid: GridNineIcon,
		landing: BrowserIcon,
		map: MapTrifoldIcon,
		motion: WaveSineIcon,
		table: TableIcon,
	},

	messages: {
		title: "ui.voila.dev",
	} satisfies Partial<DocsMessages>,

	links: [
		{ title: "Storybook", href: "https://storybook.ui.voila.dev" },
		{
			title: "GitHub",
			href: "https://github.com/voila-voila-dev/platform/tree/main/domains/ui/packages/ui",
		},
	],

	/** Where "Edit this page" sends the reader: the page's MDX on GitHub. */
	editBase:
		"https://github.com/voila-voila-dev/platform/edit/main/domains/ui/apps/ui.voila.dev/src/content/docs",

	support: {
		href: "https://github.com/voila-voila-dev/platform/issues/new",
		label: "Open an issue",
	},
} as const satisfies DocsConfig;

interface DocsConfig {
	name: string;
	description: string;
	url: string;
	language: string;
	docsRoot: string;
	storageKeys: { theme: string; audience: string; readerContext: string };
	vocabulary: {
		audiences: readonly [string, ...Array<string>];
		stages: readonly [string, ...Array<string>];
	};
	icons: Readonly<Record<string, Icon>>;
	messages: Partial<DocsMessages>;
	links: ReadonlyArray<{ title: string; href: string }>;
	editBase: string;
	support: { href: string; label: string };
}
