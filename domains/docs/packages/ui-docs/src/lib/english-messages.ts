import type { DocsMessages } from "./messages.ts";

const plural = (count: number, one: string, many: string) =>
	count === 1 ? one : many;

/** `2026-10-03` as "October 3, 2026", read as a calendar day wherever the reader is. */
function longDate(day: string): string {
	return new Intl.DateTimeFormat("en-US", {
		day: "numeric",
		month: "long",
		year: "numeric",
		timeZone: "UTC",
	}).format(new Date(`${day}T00:00:00Z`));
}

/**
 * Every word of the docs chrome in plain English: a starting point for a site
 * that writes in English, which spreads it and overrides the few it says
 * differently (`{ ...englishMessages, title: "Handbook" }`). A site in
 * another language writes its own `DocsMessages` instead.
 */
export const englishMessages: DocsMessages = {
	title: "Documentation",
	sidebarAria: "Documentation navigation",
	tabsAria: "Documentation sections",
	moreAria: "More",
	menu: "Menu",
	menuClose: "Close the menu",
	breadcrumbAria: "Breadcrumb",
	tocTitle: "On this page",
	headingAnchor: "Link to this section",
	previous: "Previous",
	next: "Next",
	pagerAria: "Previous and next pages",
	copyCode: "Copy the code",
	copyCodeDone: "Copied",
	plainText: "Text",
	copyPage: "Copy page",
	copyPageDone: "Copied",
	copyPageHint: "Copy this page as Markdown for an assistant",
	pageActionsAria: "More ways to read this page",
	viewMarkdown: "View as Markdown",
	viewMarkdownHint: "Open this page as plain text",
	openChatgpt: "Open in ChatGPT",
	openClaude: "Open in Claude",
	askAboutPage: "Ask questions about this page",
	aiPrompt: (url) =>
		`Read ${url} so I can ask you questions about it, and cite it in your answers.`,
	themeAria: "Theme",
	themeSystem: "System",
	themeLight: "Light",
	themeDark: "Dark",
	searchButton: "Search",
	searchTitle: "Search the documentation",
	searchPlaceholder: "Search the documentation…",
	searchEmpty: (query) => `Nothing found for “${query}”.`,
	searchHintNavigate: "to move",
	searchHintOpen: "to open",
	searchHintClose: "to close",
	screenshotZoom: (alt) => `Enlarge: ${alt}`,
	screenshotClose: "Close",
	api: {
		parameters: {
			path: "Path parameters",
			query: "Query parameters",
			header: "Headers",
			cookie: "Cookies",
		},
		required: "required",
		body: "Body",
		requestExample: "Request",
		responseExample: "Response",
		baseUrl: "Base URL",
		version: "Version",
		authorization: "Authorization",
		responses: "Responses",
		nullable: "nullable",
		deprecated: "deprecated",
		noContent: "No content",
		childFields: (count) =>
			`${count} ${plural(count, "child field", "child fields")}`,
		variants: "One of",
		allowedValues: "Allowed values",
		constraints: {
			minLength: (value) =>
				`at least ${value} ${plural(value, "character", "characters")}`,
			maxLength: (value) =>
				`at most ${value} ${plural(value, "character", "characters")}`,
			minimum: (value) => `≥ ${value}`,
			maximum: (value) => `≤ ${value}`,
			exclusiveMinimum: (value) => `> ${value}`,
			exclusiveMaximum: (value) => `< ${value}`,
			minItems: (value) =>
				`at least ${value} ${plural(value, "item", "items")}`,
			maxItems: (value) => `at most ${value} ${plural(value, "item", "items")}`,
		},
		copyUrl: "Copy the URL",
		copyUrlDone: "Copied",
		bearer: "Bearer token",
	},
	guide: {
		pathsTitle: "Paths",
		pathLength: (steps) => `${steps} ${plural(steps, "step", "steps")}`,
		pathProgress: (step, total) => `Step ${step} of ${total}`,
		pathStepsAria: "The steps of this path",
		plannedLabel: "Coming soon",
		prerequisitesTitle: "Before you start",
		nextStepsTitle: "Next steps",
		usedInPathsTitle: "Part of these paths",
		sourcesTitle: "Sources",
		lastVerified: (day) => `Last checked on ${longDate(day)}`,
		stillStuckTitle: "Still stuck?",
		stillStuckBody: "Tell us what you were looking for.",
		audienceSwitcherAria: "Who you are",
	},
	readerContext: {
		title: "Your situation",
		unset: "Not set",
		choose: "Choose",
		change: "Change",
		close: "Close",
		hint: "The pages written for another situation are dimmed.",
		restriction: (dimension, values) => `${dimension}: ${values}`,
		notForYou: (restrictions) => `Written for ${restrictions}`,
		variantsTitle: "This guide for another situation",
	},
};
