import { describe, expect, it } from "bun:test";
import { contextResolver } from "./context-resolver.ts";

describe("contextResolver", () => {
	const contextOf = contextResolver({
		groupingDirectories: ["platform", "platform/integrations"],
	});

	it("takes the first folder", () => {
		expect(contextOf("billing/use-cases/x.ts")).toBe("billing");
	});

	it("looks through grouping folders, nested ones included", () => {
		expect(contextOf("platform/money/money.ts")).toBe("platform/money");
		expect(contextOf("platform/integrations/vies/vies.ts")).toBe(
			"platform/integrations/vies",
		);
	});

	it("keeps a root file as its own context", () => {
		expect(contextResolver()("registry.ts")).toBe("registry.ts");
	});
});
