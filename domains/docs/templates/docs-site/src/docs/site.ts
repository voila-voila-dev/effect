import { apiNavigationGroups } from "@voila.dev/docs/api-reference/navigation";
import { resolveNavigation } from "@voila.dev/docs/navigation";

import { docsConfig } from "../../docs.config.ts";
import { docsNavigation } from "../content/docs/navigation.ts";
import { apiReference } from "./api-reference.ts";
import { docPages } from "./pages.ts";

/** The API tab's groups: its overview, then one group per tag of the OpenAPI document. */
const apiGroups = apiNavigationGroups(apiReference, {
	title: docsConfig.api.overviewTitle,
	href: docsConfig.apiRoot,
	icon: "code",
});

/** The sidebar: the registry's slugs resolved to their pages, and the API tab to the reference. */
export const docsTabs = resolveNavigation(docsNavigation, docPages, apiGroups);
