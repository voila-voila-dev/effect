/**
 * docs.voila.dev, made from `domains/docs/templates/docs-site`: this file and the content
 * are what differ. The package pages are the packages' own READMEs
 * (`src/docs/readme-pages.ts`), so they never drift from what npm shows.
 */
import {
	BookOpenTextIcon,
	CodeIcon,
	CompassIcon,
	type Icon,
	PlugsConnectedIcon,
	RocketLaunchIcon,
} from "@phosphor-icons/react";
import type { DocsMessages } from "@voila.dev/ui-docs/lib/messages";

export const docsConfig = {
	name: "voila.dev platform",
	description:
		"Building blocks for B2B products on Effect 4, React 19 and Tailwind 4: what each package gives you, and how to start.",
	url: "https://docs.voila.dev",
	language: "en",

	docsRoot: "/",

	storageKeys: {
		theme: "voila-docs:theme",
		audience: "voila-docs:audience",
		readerContext: "voila-docs:reader-context",
	},

	vocabulary: {
		audiences: ["everyone"],
		stages: ["start", "build"],
		landings: { everyone: "index" },
	},

	icons: {
		book: BookOpenTextIcon,
		code: CodeIcon,
		compass: CompassIcon,
		plug: PlugsConnectedIcon,
		rocket: RocketLaunchIcon,
	},

	messages: {
		title: "voila.dev",
	} satisfies Partial<DocsMessages>,

	brand: {
		name: "voila.dev",
		section: "Platform",
		logo: "/favicon.svg",
	},

	links: [
		{ title: "UI", href: "https://ui.voila.dev" },
		{ title: "GitHub", href: "https://github.com/voila-voila-dev/platform" },
	],

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
		landings: Readonly<Record<string, string>>;
	};
	icons: Readonly<Record<string, Icon>>;
	messages: Partial<DocsMessages>;
	brand: { name: string; section: string; logo: string };
	links: ReadonlyArray<{ title: string; href: string }>;
	support: { href: string; label: string };
}
