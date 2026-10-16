import { describe, expect, it } from "bun:test";

import { curlOf, exampleOf, exampleResponses, fetchOf } from "./examples.ts";
import { fixtureOptions, health, projects } from "./fixtures.test-helper.ts";
import { toApiReference } from "./model.ts";

const reference = toApiReference(projects, fixtureOptions);
const [list, get, create] = reference.operations;
const healthReference = toApiReference(health, fixtureOptions);
const [probe] = healthReference.operations;

function healthProbe() {
	if (!probe) {
		throw new Error("the health fixture lost its operation");
	}
	return probe;
}
const anything = { kind: "any", nullable: false } as const;

describe("exampleOf", () => {
	it("fills every property, with the first enum value and a uuid for ids", () => {
		const project = exampleOf(get?.responses[0]?.body?.schema ?? anything);

		expect(project).toMatchObject({
			_tag: "Project",
			id: "3f6c2b1e-8a4d-4c2f-9b7e-1d5a6e8f0c21",
			labels: ["backend"],
		});
	});

	it("takes the example the contract wrote over one derived from the shape", () => {
		expect(
			exampleOf(healthProbe().responses[0]?.body?.schema ?? anything),
		).toEqual({
			status: "ok",
			version: "6d649b3612c4e0f1a8b2d9c7e5f30a4b1c2d3e4f",
			checks: { database: true, payments: true },
		});
	});

	it("starts a bounded number at its minimum", () => {
		expect(
			exampleOf(list?.responses[0]?.body?.schema ?? anything),
		).toMatchObject({ take: 1, hasMore: true });
	});
});

describe("curlOf", () => {
	it("spells the method, URL, headers and body", () => {
		if (!create) {
			throw new Error("the fixture lost its create operation");
		}
		const curl = curlOf(create, reference.serverUrl);

		expect(curl.split("\n").slice(0, 4)).toEqual([
			"curl --request POST \\",
			"  --url 'https://api.example.com/projects/create' \\",
			"  --header 'authorization: <authorization>' \\",
			"  --header 'Content-Type: application/json' \\",
		]);
		expect(curl).toContain(`"labels": [\n    "backend"\n  ]`);
	});
});

describe("fetchOf", () => {
	it("spells the same call with fetch", () => {
		if (!create) {
			throw new Error("the fixture lost its create operation");
		}
		const code = fetchOf(create, reference.serverUrl);

		expect(code.split("\n").slice(0, 7)).toEqual([
			'const response = await fetch("https://api.example.com/projects/create", {',
			'  method: "POST",',
			"  headers: {",
			'    authorization: "<authorization>",',
			'    "Content-Type": "application/json",',
			"  },",
			"  body: JSON.stringify({",
		]);
		expect(code).toContain(`"labels": [\n      "backend"\n    ]`);
		expect(code.endsWith("const data = await response.json();")).toBe(true);
	});
});

describe("exampleResponses", () => {
	it("shows a failure the contract gives an example of beside the success", () => {
		expect(
			exampleResponses(healthProbe()).map((response) => response.status),
		).toEqual(["200", "503"]);
	});

	it("leaves out the failures the contract gives no example of", () => {
		if (!create) {
			throw new Error("the fixture lost its create operation");
		}
		expect(exampleResponses(create).map((response) => response.status)).toEqual(
			["200"],
		);
	});
});

describe("a GET without parameters or body", () => {
	it("is called with cURL without a header or data", () => {
		expect(curlOf(healthProbe(), healthReference.serverUrl)).toBe(
			"curl --request GET \\\n  --url 'https://api.example.com/health'",
		);
	});

	it("is called with a bare fetch", () => {
		expect(fetchOf(healthProbe(), healthReference.serverUrl)).toBe(
			'const response = await fetch("https://api.example.com/health");\nconst data = await response.json();',
		);
	});
});
