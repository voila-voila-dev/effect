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
import { DocsLayout } from "../components/docs-layout.tsx";
import { NotFound } from "../components/not-found.tsx";
import globalsCss from "../styles/globals.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: docsConfig.name },
			{ name: "description", content: docsConfig.description },
		],
		links: [
			{ rel: "icon", href: docsConfig.brand.logo, type: "image/svg+xml" },
			{ rel: "stylesheet", href: globalsCss },
		],
		// Sets the dark class before the first paint, so a reader who chose the
		// dark theme never sees the light one flash.
		scripts: [{ children: themeScript(docsConfig.storageKeys.theme) }],
	}),
	shellComponent: RootDocument,
	component: RootLayout,
	notFoundComponent: NotFound,
});

function RootDocument({ children }: { children: ReactNode }) {
	return (
		// The theme script changes the class before React hydrates.
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

function RootLayout() {
	return (
		<DocsLayout>
			<Outlet />
		</DocsLayout>
	);
}
