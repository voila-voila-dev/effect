import { createFileRoute, notFound } from "@tanstack/react-router";

import { docsConfig } from "../../../docs.config.ts";
import { ApiOverview } from "../../components/api-pages.tsx";
import { apiReference } from "../../docs/api-reference.ts";
import { pageHead } from "../../docs/head.ts";

/** The API reference's landing: the base URL and every operation, by tag. */
export const Route = createFileRoute("/api/")({
	loader: () => {
		if (apiReference.operations.length === 0) {
			throw notFound();
		}
	},
	head: () =>
		pageHead({
			title: apiReference.title,
			description: apiReference.description ?? docsConfig.description,
			href: docsConfig.apiRoot,
		}),
	component: ApiOverview,
});
