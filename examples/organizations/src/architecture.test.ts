import { describe, expect, it } from "bun:test";
import { registryProblems, unknownPermissions } from "@voila.dev/effect-ddd";
import {
	contextResolver,
	describeEdges,
	importEdges,
	listSourceFiles,
	undeclaredEdges,
	useCaseNameOf,
} from "@voila.dev/effect-ddd/architecture";
import { PERMISSIONS } from "./identity/permission.ts";
import { useCases } from "./use-case-registry.ts";

// The conventions of this codebase, frozen as tests: each one fails the build
// with a message saying what to do, instead of waiting for a reviewer.

const root = import.meta.dirname;
const files = listSourceFiles(root);
const contextOf = contextResolver();

describe("use case registry", () => {
	const declared = files
		.filter((file) => /\/use-cases\/[^/]+-use-case\.ts$/u.test(file))
		.map((file) => useCaseNameOf(file, contextOf));

	it("registers every use case once, named after its file", () => {
		expect(registryProblems(useCases, declared)).toStrictEqual([]);
	});

	it("gates on permissions that exist", () => {
		expect(
			unknownPermissions(useCases, {
				organization: PERMISSIONS,
				actor: ["user"],
			}),
		).toStrictEqual([]);
	});
});

describe("context dependencies", () => {
	const edges = importEdges({ root, files, contextOf });

	it("keeps identity free of the contexts that use it", () => {
		expect(
			describeEdges(edges.filter((edge) => edge.source === "identity")),
			"identity is the shared kernel: it must not import a business context",
		).toStrictEqual([]);
	});

	it("allows only the documented edges", () => {
		expect(
			describeEdges(
				undeclaredEdges(
					edges,
					[["organization", "identity"]],
					(context) => !context.endsWith(".ts"),
				),
			),
		).toStrictEqual([]);
	});
});
