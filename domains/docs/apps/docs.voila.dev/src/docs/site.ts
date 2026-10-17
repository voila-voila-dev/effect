import { resolveNavigation } from "@voila.dev/docs/navigation";

import { docsNavigation } from "../content/docs/navigation.ts";
import { docPages } from "./pages.ts";

/** The sidebar: the registry's slugs resolved to their pages. The platform has no HTTP API, so no API tab. */
export const docsTabs = resolveNavigation(docsNavigation, docPages, []);
