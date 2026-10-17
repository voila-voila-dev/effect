/// <reference types="vite/client" />
import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { themeScript } from "@voila.dev/ui-docs/lib/theme-script";
import type { ReactNode } from "react";

import { docsConfig } from "../../docs.config.ts";
import { NotFound } from "../components/not-found.tsx";
import { palettesScript } from "../lib/palettes.ts";
import globalsCss from "../styles/globals.css?url";

const ogTitle = "Build your SaaS with AI — on components you actually own.";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: docsConfig.name },
			{ name: "description", content: docsConfig.description },
			{ property: "og:title", content: ogTitle },
			{ property: "og:description", content: docsConfig.description },
			{ property: "og:type", content: "website" },
			{ property: "og:url", content: docsConfig.url },
			{ property: "og:site_name", content: docsConfig.name },
			{ property: "og:image", content: `${docsConfig.url}/og.png` },
			{ name: "twitter:card", content: "summary_large_image" },
			{ name: "twitter:title", content: ogTitle },
			{
				name: "twitter:description",
				content: "Your AI can't customize what it can't read. Ours, it can.",
			},
			{ name: "twitter:image", content: `${docsConfig.url}/og.png` },
		],
		links: [
			{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
			{ rel: "preconnect", href: "https://fonts.googleapis.com" },
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous",
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Instrument+Sans:wght@400;500;600;700&family=Intel+One+Mono:wght@400;500;600;700&display=swap",
			},
			{ rel: "stylesheet", href: globalsCss },
		],
		scripts: [
			// Before the first paint: the reader's light or dark choice, then the
			// palette they picked, so a reload flashes neither.
			{ children: themeScript(docsConfig.storageKeys.theme) },
			{ children: palettesScript() },
		],
	}),
	shellComponent: RootDocument,
	component: Outlet,
	notFoundComponent: NotFound,
});

function RootDocument({ children }: { children: ReactNode }) {
	return (
		// The theme and palette scripts change <html> before React hydrates.
		<html lang={docsConfig.language} suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<Scripts />
			</body>
		</html>
	);
}
