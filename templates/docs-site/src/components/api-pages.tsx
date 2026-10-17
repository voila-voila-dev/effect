import type { ApiOperation } from "@voila.dev/docs/api-reference/model";
import { ApiOperationPage } from "@voila.dev/ui-docs/components/api/api-operation";
import { ApiOverviewPage } from "@voila.dev/ui-docs/components/api/api-overview";

import { docsConfig } from "../../docs.config.ts";
import { apiReference } from "../docs/api-reference.ts";

export function ApiOverview() {
	return (
		<ApiOverviewPage
			reference={apiReference}
			description={apiReference.description ?? docsConfig.description}
			url={new URL(docsConfig.apiRoot, docsConfig.url).href}
		/>
	);
}

export function ApiOperationArticle({
	operation,
}: {
	operation: ApiOperation;
}) {
	return (
		<ApiOperationPage
			operation={operation}
			serverUrl={apiReference.serverUrl}
			url={new URL(operation.href, docsConfig.url).href}
		/>
	);
}
