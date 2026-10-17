import {
	ArrowSquareOutIcon,
	BookOpenIcon,
	GithubLogoIcon,
	type Icon,
} from "@phosphor-icons/react";
import { Link, useNavigate } from "@tanstack/react-router";
import { DocsFrame } from "@voila.dev/ui-docs/components/docs-frame";
import {
	type DocsLinkComponent,
	DocsProvider,
} from "@voila.dev/ui-docs/components/docs-provider";
import { englishMessages } from "@voila.dev/ui-docs/lib/english-messages";
import type { ComponentProps, ReactNode } from "react";

import { docsConfig } from "../../docs.config.ts";
import { PaletteSelect } from "./palette-select.tsx";
import { useDocsNavigation } from "./use-docs-navigation.ts";
import { Wordmark } from "./wordmark.tsx";

const messages = { ...englishMessages, ...docsConfig.messages };

// No reader context: every page is written for every reader.
const readerContext = {
	storageKey: docsConfig.storageKeys.readerContext,
	dimensions: [],
	applicability: {},
};

/**
 * `/ui/button/?tab=y#z` split into what the router takes apart. The pages
 * link with the trailing slash the site has always served them under; the
 * router's paths have none.
 */
export function routeOf(href: string) {
	const [beforeHash = href, hash] = href.split("#");
	const [path = beforeHash, query = ""] = beforeHash.split("?");
	const search = Object.fromEntries(new URLSearchParams(query));
	return { to: path.replace(/(.)\/+$/u, "$1"), hash, search };
}

/** The docs' links go through TanStack Router, which navigates client-side and preloads on hover. */
function RouterLink({ href, ...props }: ComponentProps<DocsLinkComponent>) {
	if (/^[a-z]+:/u.test(href)) {
		return <a href={href} {...props} />;
	}
	const { to, hash, search } = routeOf(href);
	return <Link to={to} hash={hash} search={search} {...props} />;
}

export async function loadSearchIndex() {
	const { searchEntries, searchSuggestions, searchSynonyms } = await import(
		"../docs/search-index.ts"
	);
	return {
		entries: searchEntries,
		suggestions: searchSuggestions,
		synonyms: searchSynonyms,
	};
}

/** The docs' context (router, words, navigation) without the frame: the home page's search uses it too. */
export function SiteDocsProvider({ children }: { children: ReactNode }) {
	const navigation = useDocsNavigation();
	const navigate = useNavigate();
	return (
		<DocsProvider
			Link={RouterLink}
			navigate={(href) => void navigate(routeOf(href))}
			messages={messages}
			icons={docsConfig.icons}
			navigation={navigation}
			footer={<p>© {new Date().getFullYear()} voila.dev · MIT licensed</p>}
			support={docsConfig.support}
			audienceStorageKey={docsConfig.storageKeys.audience}
			constants={{}}
			readerContext={readerContext}
		>
			{children}
		</DocsProvider>
	);
}

const LINK_ICONS: Readonly<Record<string, Icon>> = {
	Storybook: BookOpenIcon,
	GitHub: GithubLogoIcon,
};

/** Icons rather than words: ten tabs leave the header little room. */
function HeaderLinks() {
	return (
		<>
			{docsConfig.links.map((link) => {
				const LinkIcon = LINK_ICONS[link.title] ?? ArrowSquareOutIcon;
				return (
					<a
						key={link.href}
						href={link.href}
						target="_blank"
						rel="noopener noreferrer"
						aria-label={link.title}
						title={link.title}
						className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
					>
						<LinkIcon className="size-4" aria-hidden />
					</a>
				);
			})}
			<PaletteSelect />
		</>
	);
}

/** The shared frame, with the site's wordmark, links, theme palettes and router. */
export function DocsLayout({ children }: { children: ReactNode }) {
	return (
		<SiteDocsProvider>
			<DocsFrame
				themeStorageKey={docsConfig.storageKeys.theme}
				// The home page follows the reader's light or dark choice too.
				themeScope="site"
				loadSearchIndex={loadSearchIndex}
				brand={<Wordmark />}
				actions={<HeaderLinks />}
				menuLinks={docsConfig.links.map((link) => ({
					...link,
					icon: ArrowSquareOutIcon,
				}))}
			>
				{children}
			</DocsFrame>
		</SiteDocsProvider>
	);
}
