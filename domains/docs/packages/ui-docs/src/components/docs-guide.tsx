import type { DocSource } from "@voila.dev/docs/page";
import type { Applicability } from "@voila.dev/docs/reader-context";
import { createContext, type ReactNode, useContext } from "react";

/** A page another component points to, its title and address already resolved. */
export interface DocsPageLink {
	title: string;
	href: string;
	description?: string;
	icon?: string;
}

export interface DocsPathStepLink extends DocsPageLink {
	/** When the step does not apply to every reader: "Already have an account? Skip to step 2." */
	context?: string;
}

/** A path as a reader meets it: its page, and its steps with links that keep the reader in it. */
export interface DocsPathView {
	id: string;
	title: string;
	href: string;
	steps: ReadonlyArray<DocsPathStepLink>;
}

/** A path the site announces before writing it, so a reader in that situation learns it is coming. */
export interface DocsPlannedPathView {
	id: string;
	title: string;
	description: string;
	/** The reader context it will answer; without one it shows to every reader. */
	appliesTo?: Applicability;
}

/** A country variant of a guide, with the context it is written for. */
export interface DocsContextLink {
	title: string;
	href: string;
	appliesTo: Applicability;
}

export interface DocsAudienceIndexView {
	audience: string;
	paths: ReadonlyArray<DocsPathView>;
	planned: ReadonlyArray<DocsPlannedPathView>;
	/** The audience's other pages, under the sidebar topics that list them. */
	topics: ReadonlyArray<{ label: string; pages: ReadonlyArray<DocsPageLink> }>;
}

/** What the page's frontmatter and the path registry say around its content. */
export interface DocsPageGuide {
	prerequisites: ReadonlyArray<DocsPageLink>;
	next: ReadonlyArray<DocsPageLink>;
	/** The path the reader follows here, and the 0-based index of this page in it. */
	place?: { path: DocsPathView; index: number };
	usedIn: ReadonlyArray<DocsPathView>;
	/** The same guide written for other reader contexts. */
	variants: ReadonlyArray<DocsContextLink>;
	sources: ReadonlyArray<DocSource>;
	/** `YYYY-MM-DD`, the day the sources were last read. */
	lastVerified?: string;
	/** Set on a path's own page: the path it introduces. */
	introduces?: DocsPathView;
	/** Set on an audience landing: what it lists. */
	audienceIndex?: DocsAudienceIndexView;
}

const DocsGuideContext = createContext<DocsPageGuide | undefined>(undefined);

export function DocsGuideProvider({
	guide,
	children,
}: {
	guide: DocsPageGuide;
	children: ReactNode;
}) {
	return (
		<DocsGuideContext.Provider value={guide}>
			{children}
		</DocsGuideContext.Provider>
	);
}

export function useDocsGuide(): DocsPageGuide {
	const guide = useContext(DocsGuideContext);
	if (!guide) {
		throw new Error(
			"A docs page component rendered outside <DocsGuideProvider>",
		);
	}
	return guide;
}
