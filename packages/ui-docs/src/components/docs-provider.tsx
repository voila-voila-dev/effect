import type { Icon } from "@phosphor-icons/react";
import type { NavLocation, NavTab } from "@voila.dev/docs/navigation";
import type { Applicability } from "@voila.dev/docs/reader-context";
import {
	type ComponentProps,
	type ComponentType,
	createContext,
	type ReactNode,
	useContext,
} from "react";

import type { DocsMessages } from "../lib/messages.ts";

export type DocsLinkComponent = ComponentType<
	Omit<ComponentProps<"a">, "href"> & { href: string }
>;

/** Where the reader is: what the header, sidebar, breadcrumb and footer all read. */
export interface DocsNavigationState {
	pathname: string;
	tabs: ReadonlyArray<NavTab>;
	/** The tab the page sits in, or the first one for a page outside the sidebar. */
	activeTab: NavTab | undefined;
	location: NavLocation | undefined;
}

/** A reader context dimension as the picker shows it: its words and its values with theirs. */
/** One answer a dimension offers. */
export interface DocsReaderOption {
	value: string;
	label: string;
	/** An emoji drawn before the label and in the sidebar chip: "🇫🇷". */
	flag?: string;
}

export interface DocsReaderDimensionView {
	name: string;
	/** The select's label: "Your company's country". */
	label: string;
	/** The chip's and the restrictions' label: "Entreprise". */
	shortLabel: string;
	queryParameter: string;
	audiences: readonly [string, ...Array<string>];
	options: readonly [DocsReaderOption, ...Array<DocsReaderOption>];
}

/** The reader context a site asks for, and what each of its pages is written for. */
export interface DocsReaderContextConfig {
	/** Where the reader's answers are remembered, on this device only. */
	storageKey: string;
	dimensions: ReadonlyArray<DocsReaderDimensionView>;
	/** The applicability of every page that declares one, by href. */
	applicability: Readonly<Record<string, Applicability>>;
}

interface DocsContextValue {
	/** Renders a link inside the site, so the host's router navigates client-side. */
	Link: DocsLinkComponent;
	navigate: (href: string) => void;
	messages: DocsMessages;
	/** The glyphs the navigation and the cards name. */
	icons: Readonly<Record<string, Icon>>;
	navigation: DocsNavigationState;
	/** What every page ends with, under the previous and next links. */
	footer: ReactNode;
	/** Where "Still stuck?" sends the reader: the site's existing support contact. */
	support: { href: string; label: string };
	/** Where the sidebar remembers the audience the reader last chose. */
	audienceStorageKey: string;
	/** The values `<CodeValue name="…" />` renders, formatted, by name. */
	constants: Readonly<Record<string, string>>;
	readerContext: DocsReaderContextConfig;
}

const DocsContext = createContext<DocsContextValue | undefined>(undefined);

export function DocsProvider({
	children,
	...value
}: DocsContextValue & { children: ReactNode }) {
	return <DocsContext.Provider value={value}>{children}</DocsContext.Provider>;
}

export function useDocs(): DocsContextValue {
	const value = useContext(DocsContext);
	if (!value) {
		throw new Error("A docs component rendered outside <DocsProvider>");
	}
	return value;
}
