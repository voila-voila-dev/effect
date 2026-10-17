import { describe, expect, it } from "bun:test";
import { registryProblems, unknownPermissions } from "@voila.dev/effect-ddd";
import {
	contextResolver,
	listSourceFiles,
	useCaseNameOf,
} from "@voila.dev/effect-ddd/architecture";
import { EMAIL_PERMISSIONS } from "./access/email-permission.ts";
import { emailUseCases } from "./use-case-registry.ts";

const root = import.meta.dirname;
const contextOf = contextResolver();
const declared = listSourceFiles(root)
	.filter((file) => /\/use-cases\/[^/]+-use-case\.ts$/u.test(file))
	.map((file) => useCaseNameOf(file, contextOf));

describe("emailUseCases", () => {
	it("registers every use case once, named after its subdomain and file", () => {
		expect(registryProblems(emailUseCases, declared)).toStrictEqual([]);
	});

	it("gates on permissions the domain declares", () => {
		expect(
			unknownPermissions(emailUseCases, {
				email: EMAIL_PERMISSIONS,
				actor: ["system"],
			}),
		).toStrictEqual([]);
	});
});
