import { toApiReference } from "@voila.dev/docs/api-reference/model";

import { docsConfig } from "../../docs.config.ts";
import openapi from "../content/openapi.json" with { type: "json" };

/**
 * The API reference, from the OpenAPI 3 document your API writes. Replace
 * `src/content/openapi.json` with yours (or generate it before the build);
 * a document with no operation hides the tab and its pages. A site without
 * an API deletes this file, `src/content/openapi.json` and `src/routes/api`,
 * and passes no API groups in `site.ts`.
 */
export const apiReference = toApiReference(openapi, {
	root: docsConfig.apiRoot,
	untaggedLabel: docsConfig.api.untaggedLabel,
	fallbackServerUrl: docsConfig.api.fallbackServerUrl,
});
