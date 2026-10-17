import type { ApiMarkdownLabels } from "@voila.dev/docs/api-reference/markdown";
import type { ConstraintKeyword } from "@voila.dev/docs/api-reference/schema-node";

/** The API reference pages' words, the Markdown export's included. */
export interface DocsApiMessages extends ApiMarkdownLabels {
	version: string;
	authorization: string;
	responses: string;
	nullable: string;
	deprecated: string;
	noContent: string;
	childFields: (count: number) => string;
	variants: string;
	allowedValues: string;
	constraints: Readonly<Record<ConstraintKeyword, (value: number) => string>>;
	copyUrl: string;
	copyUrlDone: string;
	bearer: string;
}

/** The words around a guide: its path, what comes before and after it, its sources, the help at its end. */
export interface DocsGuideMessages {
	pathsTitle: string;
	pathLength: (steps: number) => string;
	/** "Step 3 of 7", 1-based. */
	pathProgress: (step: number, total: number) => string;
	pathStepsAria: string;
	/** The badge on a path announced but not written yet. */
	plannedLabel: string;
	prerequisitesTitle: string;
	nextStepsTitle: string;
	usedInPathsTitle: string;
	sourcesTitle: string;
	/** Given the `YYYY-MM-DD` day the sources were read. */
	lastVerified: (day: string) => string;
	stillStuckTitle: string;
	stillStuckBody: string;
	audienceSwitcherAria: string;
}

/** The words of the reader context: the countries a reader picks, and what changes with them. */
export interface DocsReaderContextMessages {
	title: string;
	/** A select's choice for a reader who does not say. */
	unset: string;
	choose: string;
	change: string;
	close: string;
	hint: string;
	/** One restriction, given a dimension's short label and its values: "Company: Luxembourg". */
	restriction: (dimension: string, values: string) => string;
	/** Why a page is dimmed, given its restrictions. */
	notForYou: (restrictions: string) => string;
	variantsTitle: string;
}

/** Every word the docs chrome shows, in the reader's language: the package ships none of its own. */
export interface DocsMessages {
	/** The drawer's title on a phone. */
	title: string;
	sidebarAria: string;
	tabsAria: string;
	moreAria: string;
	menu: string;
	menuClose: string;
	breadcrumbAria: string;
	tocTitle: string;
	headingAnchor: string;
	previous: string;
	next: string;
	pagerAria: string;
	copyCode: string;
	copyCodeDone: string;
	/** The tab label of a fence without a language. */
	plainText: string;
	copyPage: string;
	copyPageDone: string;
	copyPageHint: string;
	pageActionsAria: string;
	viewMarkdown: string;
	viewMarkdownHint: string;
	openChatgpt: string;
	openClaude: string;
	askAboutPage: string;
	/** What an assistant is asked, given the page's absolute URL. */
	aiPrompt: (url: string) => string;
	themeAria: string;
	themeSystem: string;
	themeLight: string;
	themeDark: string;
	searchButton: string;
	searchTitle: string;
	searchPlaceholder: string;
	searchEmpty: (query: string) => string;
	searchHintNavigate: string;
	searchHintOpen: string;
	searchHintClose: string;
	/** The label of a screenshot that opens it full size, given its alt text. */
	screenshotZoom: (alt: string) => string;
	screenshotClose: string;
	api: DocsApiMessages;
	guide: DocsGuideMessages;
	readerContext: DocsReaderContextMessages;
}
