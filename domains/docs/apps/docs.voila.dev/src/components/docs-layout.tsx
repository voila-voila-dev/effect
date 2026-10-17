import { ArrowSquareOutIcon } from "@phosphor-icons/react";
import { Link, useNavigate } from "@tanstack/react-router";
import { DocsFrame } from "@voila.dev/ui-docs/components/docs-frame";
import { DocsLink } from "@voila.dev/ui-docs/components/docs-link";
import {
	type DocsLinkComponent,
	DocsProvider,
} from "@voila.dev/ui-docs/components/docs-provider";
import { englishMessages } from "@voila.dev/ui-docs/lib/english-messages";
import type { ComponentProps, ReactNode } from "react";

import { docsConfig } from "../../docs.config.ts";
import { pageHref } from "../docs/vocabulary.ts";
import { useDocsNavigation } from "./use-docs-navigation.ts";

const messages = { ...englishMessages, ...docsConfig.messages };

// No reader context: a site whose pages differ by country or plan declares
// its dimensions here (see @voila.dev/docs/reader-context).
const readerContext = {
	storageKey: docsConfig.storageKeys.readerContext,
	dimensions: [],
	applicability: {},
};

/** `/guides/x?tab=y#z` split into what the router takes apart. */
function routeOf(href: string) {
	const [beforeHash = href, hash] = href.split("#");
	const [to = beforeHash, query = ""] = beforeHash.split("?");
	const search = Object.fromEntries(new URLSearchParams(query));
	return { to, hash, search };
}

/** The docs' links go through TanStack Router, which navigates client-side and preloads on hover. */
function RouterLink({ href, ...props }: ComponentProps<DocsLinkComponent>) {
	const { to, hash, search } = routeOf(href);
	return <Link to={to} hash={hash} search={search} {...props} />;
}

function Brand() {
	return (
		<DocsLink
			href={pageHref("index")}
			aria-label={docsConfig.name}
			className="flex items-center gap-2.5"
		>
			<img src={docsConfig.brand.logo} alt="" className="size-6" />
			<span className="font-semibold text-docs-sm text-foreground">
				{docsConfig.brand.name}
			</span>
			<span className="border-border border-l pl-2.5 font-medium text-docs-sm text-muted-foreground">
				{docsConfig.brand.section}
			</span>
		</DocsLink>
	);
}

function HeaderLinks() {
	return docsConfig.links.map((link) => (
		<a
			key={link.href}
			href={link.href}
			target="_blank"
			rel="noopener noreferrer"
			className="rounded-lg px-2.5 py-1.5 font-medium text-docs-sm text-muted-foreground transition-colors hover:text-foreground"
		>
			{link.title}
		</a>
	));
}

async function loadSearchIndex() {
	const { searchEntries, searchSuggestions, searchSynonyms } = await import(
		"../docs/search-index.ts"
	);
	return {
		entries: searchEntries,
		suggestions: searchSuggestions,
		synonyms: searchSynonyms,
	};
}

/** The shared frame, with the site's brand, links, words and router. */
export function DocsLayout({ children }: { children: ReactNode }) {
	const navigation = useDocsNavigation();
	const navigate = useNavigate();
	return (
		<DocsProvider
			Link={RouterLink}
			navigate={(href) => void navigate(routeOf(href))}
			messages={messages}
			icons={docsConfig.icons}
			navigation={navigation}
			footer={
				<p>
					© {new Date().getFullYear()} {docsConfig.brand.name}
				</p>
			}
			support={docsConfig.support}
			audienceStorageKey={docsConfig.storageKeys.audience}
			constants={{}}
			readerContext={readerContext}
		>
			<DocsFrame
				themeStorageKey={docsConfig.storageKeys.theme}
				loadSearchIndex={loadSearchIndex}
				brand={<Brand />}
				actions={<HeaderLinks />}
				menuLinks={docsConfig.links.map((link) => ({
					...link,
					icon: ArrowSquareOutIcon,
				}))}
			>
				{children}
			</DocsFrame>
		</DocsProvider>
	);
}
