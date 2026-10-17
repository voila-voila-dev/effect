/**
 * The one file to edit when you start a site from this template: its name and
 * address, where the docs are served, the words the frontmatter may use, the
 * icons a page may name, the chrome's words and the brand. Everything under
 * `src/` reads it from here.
 */
import {
	BookOpenTextIcon,
	CodeIcon,
	CompassIcon,
	GearSixIcon,
	type Icon,
	LightningIcon,
	PuzzlePieceIcon,
	RocketLaunchIcon,
} from "@phosphor-icons/react";
import type { DocsMessages } from "@voila.dev/ui-docs/lib/messages";

export const docsConfig = {
	/** Shown in the header, the page titles and the footer. */
	name: "Acme Docs",
	description: "Everything you need to build on Acme.",
	/** The site's origin: canonical URLs, the sitemap, and what "Ask Claude" is asked to read. */
	url: "https://docs.example.com",
	/** The page language, `<html lang>`. */
	language: "en",

	/**
	 * Where the pages are served. The routes in `src/routes` serve them from the
	 * site root; to serve them under `/docs`, set it here and move
	 * `src/routes/{index,$}.tsx` into `src/routes/docs/`.
	 */
	docsRoot: "/",
	/** Where the API reference built from `src/content/openapi.json` is served. */
	apiRoot: "/api",

	/** Where the browser remembers the reader's choices: one prefix per site, so two sites on one domain do not share them. */
	storageKeys: {
		theme: "acme-docs:theme",
		audience: "acme-docs:audience",
		readerContext: "acme-docs:reader-context",
	},

	/**
	 * The words a page's frontmatter files it under. `audience` says who a page
	 * is for (every page names one or more); `stage` the moment of the reader's
	 * journey it belongs to. Each audience starts from a landing page, by slug.
	 */
	vocabulary: {
		audiences: ["everyone"],
		stages: ["start", "build", "operate"],
		landings: { everyone: "index" },
	},

	/** The icons a page (`icon:`), a tab or a card may name: a closed list keeps the bundle to what the pages use. */
	icons: {
		book: BookOpenTextIcon,
		code: CodeIcon,
		compass: CompassIcon,
		gear: GearSixIcon,
		lightning: LightningIcon,
		puzzle: PuzzlePieceIcon,
		rocket: RocketLaunchIcon,
	},

	/** The chrome's words: English by default, override any of them here. */
	messages: {
		title: "Acme Docs",
	} satisfies Partial<DocsMessages>,

	brand: {
		/** The header's home link: the docs' name beside a mark (`public/favicon.svg`). */
		name: "Acme",
		section: "Docs",
		logo: "/favicon.svg",
	},

	/** Links at the right of the header, and in the phone menu. */
	links: [{ title: "GitHub", href: "https://github.com/acme/acme" }],

	/** Where "Still stuck?" at the end of every page sends the reader. */
	support: { href: "mailto:support@example.com", label: "Write to us" },

	/** The API reference: its tab's label, and the base URL when the document declares no server. */
	api: {
		tabLabel: "API reference",
		overviewTitle: "Overview",
		untaggedLabel: "General",
		fallbackServerUrl: "https://api.example.com",
	},

	/** The `--docs-*` tokens live in `src/styles/globals.css`, beside the palette. */
} as const satisfies DocsConfig;

interface DocsConfig {
	name: string;
	description: string;
	url: string;
	language: string;
	docsRoot: string;
	apiRoot: string;
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
	api: {
		tabLabel: string;
		overviewTitle: string;
		untaggedLabel: string;
		fallbackServerUrl: string;
	};
}
