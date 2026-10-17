import { BookOpenTextIcon } from "@phosphor-icons/react";
import type { NavLocation, NavTab } from "@voila.dev/docs/navigation";
import type { ComponentProps, ReactNode } from "react";
import type { DocsMessages } from "../lib/messages.ts";
import {
	type DocsLinkComponent,
	type DocsNavigationState,
	DocsProvider,
	type DocsReaderContextConfig,
} from "./docs-provider.tsx";

const NO_CONSTANTS = {};
const TEST_READER_CONTEXT = {
	storageKey: "test:docs-reader-context",
	dimensions: [],
	applicability: {},
};

// The messages that take an argument answer with their key all the same.
const PHRASED = new Set([
	"aiPrompt",
	"searchEmpty",
	"screenshotZoom",
	"pathLength",
	"pathProgress",
	"lastVerified",
]);

// The reader context's sentences show their arguments, so a test reads which restriction they carry.
const SPELLED_OUT = new Set(["restriction", "notForYou"]);

const testMessages = new Proxy({} as DocsMessages, {
	get(_, key) {
		if (key === "api" || key === "guide" || key === "readerContext") {
			return testMessages;
		}
		if (SPELLED_OUT.has(String(key))) {
			return (...values: Array<unknown>) =>
				`${String(key)}(${values.join(", ")})`;
		}
		return PHRASED.has(String(key)) ? () => String(key) : String(key);
	},
});

/** Marks the links the provider's router renders, so a test tells them from plain anchors. */
function RouterLink(props: ComponentProps<DocsLinkComponent>) {
	return <a data-router="" {...props} />;
}

/** A provider with every message spelled as its key and the given navigation. */
export function TestDocsProvider({
	tabs,
	pathname,
	location,
	constants = NO_CONSTANTS,
	readerContext = TEST_READER_CONTEXT,
	children,
}: {
	tabs: ReadonlyArray<NavTab>;
	pathname: string;
	location?: NavLocation;
	constants?: Readonly<Record<string, string>>;
	readerContext?: DocsReaderContextConfig;
	children: ReactNode;
}) {
	const navigation: DocsNavigationState = {
		pathname,
		tabs,
		activeTab: tabs[0],
		location,
	};
	return (
		<DocsProvider
			Link={RouterLink}
			navigate={() => undefined}
			messages={testMessages}
			icons={{ book: BookOpenTextIcon }}
			navigation={navigation}
			footer={null}
			support={{ href: "mailto:help@example.com", label: "help@example.com" }}
			audienceStorageKey="test:docs-audience"
			constants={constants}
			readerContext={readerContext}
		>
			{children}
		</DocsProvider>
	);
}
