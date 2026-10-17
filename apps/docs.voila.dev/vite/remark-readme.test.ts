import { describe, expect, it } from "bun:test";
import { join } from "node:path";

import { readmeLinkTarget } from "./remark-readme.ts";

const packages = join(import.meta.dirname, "../../../packages");
const readmeOf = (name: string) => join(packages, name, "README.md");

describe("readmeLinkTarget", () => {
	it("sends a link to a sibling package to its page", () => {
		expect(readmeLinkTarget(readmeOf("resend"), "../email")).toBe(
			"/packages/email",
		);
	});

	it("sends a link to a package ui.voila.dev documents there", () => {
		expect(readmeLinkTarget(readmeOf("docs"), "../ui")).toBe(
			"https://ui.voila.dev",
		);
	});

	it("sends any other file or folder to GitHub", () => {
		expect(
			readmeLinkTarget(
				readmeOf("outbox"),
				"./migrations/0001_create_outbox.sql",
			),
		).toBe(
			"https://github.com/voila-voila-dev/platform/blob/main/packages/outbox/migrations/0001_create_outbox.sql",
		);
		expect(
			readmeLinkTarget(readmeOf("effect-ddd"), "../../examples/organizations"),
		).toBe(
			"https://github.com/voila-voila-dev/platform/tree/main/examples/organizations",
		);
	});

	it("leaves absolute links, site links and anchors alone", () => {
		for (const href of ["https://effect.website", "/packages/http", "#usage"]) {
			expect(readmeLinkTarget(readmeOf("http"), href)).toBe(href);
		}
	});
});
