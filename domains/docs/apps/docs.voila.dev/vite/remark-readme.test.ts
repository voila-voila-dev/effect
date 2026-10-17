import { describe, expect, it } from "bun:test";
import { join } from "node:path";

import { readmeLinkTarget } from "./remark-readme.ts";

const repository = join(import.meta.dirname, "../../../../..");
const readmeOf = (directory: string) =>
	join(repository, directory, "README.md");

describe("readmeLinkTarget", () => {
	it("sends a link to a sibling package to its page", () => {
		expect(
			readmeLinkTarget(
				readmeOf("domains/providers/packages/resend"),
				"../../../email/packages/email",
			),
		).toBe("/packages/email");
		expect(
			readmeLinkTarget(
				readmeOf("domains/effect/packages/outbox"),
				"../effect-ddd",
			),
		).toBe("/packages/effect-ddd");
		expect(
			readmeLinkTarget(
				readmeOf("domains/effect/packages/http"),
				"../../../../packages/biome-plugins",
			),
		).toBe("/packages/biome-plugins");
	});

	it("sends a link to a package ui.voila.dev documents there", () => {
		expect(
			readmeLinkTarget(
				readmeOf("domains/docs/packages/docs"),
				"../../../ui/packages/ui",
			),
		).toBe("https://ui.voila.dev");
	});

	it("sends any other file or folder to GitHub", () => {
		expect(
			readmeLinkTarget(
				readmeOf("domains/effect/packages/outbox"),
				"./migrations/0001_create_outbox.sql",
			),
		).toBe(
			"https://github.com/voila-voila-dev/platform/blob/main/domains/effect/packages/outbox/migrations/0001_create_outbox.sql",
		);
		expect(
			readmeLinkTarget(
				readmeOf("domains/effect/packages/effect-ddd"),
				"../../examples/organizations",
			),
		).toBe(
			"https://github.com/voila-voila-dev/platform/tree/main/domains/effect/examples/organizations",
		);
	});

	it("leaves absolute links, site links and anchors alone", () => {
		for (const href of ["https://effect.website", "/packages/http", "#usage"]) {
			expect(
				readmeLinkTarget(readmeOf("domains/effect/packages/http"), href),
			).toBe(href);
		}
	});
});
