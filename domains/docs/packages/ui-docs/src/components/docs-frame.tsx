import type { ReactNode } from "react";

import { DocsHeader, type DocsHeaderSlots } from "./docs-header.tsx";
import { DocsSidebar } from "./docs-sidebar.tsx";
import {
	DocsThemeProvider,
	type DocsThemeScope,
	ThemeSwitcher,
} from "./docs-theme.tsx";
import { ReaderContextAddress } from "./reader-context.tsx";
import {
	DocsSearchProvider,
	type LoadSearchIndex,
	SearchButton,
} from "./search/docs-search.tsx";

/**
 * The docs frame: a fixed header and sidebar on a grey canvas, and the page in
 * a white rounded panel. The window scrolls, not the panel, so anchors,
 * find-in-page, the keyboard and the router's scroll restoration keep their
 * native behavior; two fixed caps redraw the panel's rounded ends over the
 * content scrolling under the header and at the bottom of the screen.
 */
export function DocsFrame({
	themeStorageKey,
	themeScope = "docs",
	loadSearchIndex,
	children,
	...header
}: DocsHeaderSlots & {
	themeStorageKey: string;
	/** `site` when the host's other pages follow the reader's theme too: leaving the docs then keeps it. */
	themeScope?: DocsThemeScope;
	/** The search index, loaded the first time the reader opens the palette. */
	loadSearchIndex: LoadSearchIndex;
	children: ReactNode;
}) {
	return (
		<DocsThemeProvider storageKey={themeStorageKey} scope={themeScope}>
			<DocsSearchProvider loadIndex={loadSearchIndex}>
				<ReaderContextAddress />
				<div className="docs-frame min-h-dvh bg-docs-canvas">
					<DocsHeader {...header} />
					<aside className="fixed top-14 bottom-0 left-0 hidden w-[16.5rem] flex-col pl-2 lg:flex">
						<div className="px-2 pt-2 pb-5">
							<SearchButton />
						</div>
						<div className="flex-1 overflow-y-auto px-2 pb-8">
							<DocsSidebar />
						</div>
						<div className="mx-2 border-border border-t py-3">
							<ThemeSwitcher />
						</div>
					</aside>
					<div className="px-2 pt-(--docs-top) pb-2 lg:pl-(--docs-rail)">
						<main className="min-h-[calc(100dvh-var(--docs-top)-0.5rem)] rounded-2xl border border-border bg-background">
							{children}
						</main>
					</div>
					<div
						aria-hidden
						className="pointer-events-none fixed inset-x-2 top-(--docs-top) z-30 h-4 bg-docs-canvas lg:left-(--docs-rail)"
					>
						<div className="h-full rounded-t-2xl border-border border-x border-t bg-background" />
					</div>
					<div
						aria-hidden
						className="pointer-events-none fixed inset-x-2 bottom-0 z-30 h-6 bg-docs-canvas lg:left-(--docs-rail)"
					>
						<div className="h-4 rounded-b-2xl border-border border-x border-b bg-background" />
					</div>
				</div>
			</DocsSearchProvider>
		</DocsThemeProvider>
	);
}
