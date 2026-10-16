import health from "./fixtures/health.openapi.json" with { type: "json" };
import projects from "./fixtures/projects.openapi.json" with { type: "json" };
import type { ApiReferenceOptions } from "./model.ts";

export const fixtureOptions: ApiReferenceOptions = {
	root: "/docs/api",
	untaggedLabel: "General",
	fallbackServerUrl: "https://api.example.com",
};

/** Groups of an example API, as an Effect HttpApi generates them: POST with bodies, and a GET without one whose failure is documented. */
export { health, projects };
