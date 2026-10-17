import { createFileRoute, notFound } from "@tanstack/react-router";
import { apiOperationAt } from "@voila.dev/docs/api-reference/navigation";

import { ApiOperationArticle } from "../../../components/api-pages.tsx";
import { apiReference } from "../../../docs/api-reference.ts";
import { pageHead } from "../../../docs/head.ts";

/** One operation of the OpenAPI document: its parameters, body, responses and examples. */
export const Route = createFileRoute("/api/$tag/$operation")({
	loader: ({ params }) => {
		if (!apiOperationAt(apiReference, params.tag, params.operation)) {
			throw notFound();
		}
	},
	head: ({ params }) => {
		const operation = apiOperationAt(
			apiReference,
			params.tag,
			params.operation,
		);
		return operation
			? pageHead({
					title: operation.summary,
					description:
						operation.description ??
						`${operation.method.toUpperCase()} ${operation.path}`,
					href: operation.href,
				})
			: {};
	},
	component: ApiOperationRoute,
});

function ApiOperationRoute() {
	const { tag, operation } = Route.useParams();
	const found = apiOperationAt(apiReference, tag, operation);
	return found ? <ApiOperationArticle operation={found} /> : null;
}
