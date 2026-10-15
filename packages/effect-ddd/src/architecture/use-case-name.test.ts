import { describe, expect, it } from "bun:test";
import { contextResolver } from "./context-resolver.ts";
import { useCaseNameOf } from "./use-case-name.ts";

describe("useCaseNameOf", () => {
	it("names a use case after its context and file", () => {
		expect(
			useCaseNameOf(
				"billing/use-cases/issue-invoice-use-case.ts",
				contextResolver(),
			),
		).toBe("billing.issue-invoice");
	});
});
