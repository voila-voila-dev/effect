import { describe, expect, it } from "bun:test";
import { actorKind } from "./actor-kind.ts";

describe("actorKind", () => {
	it("reads the actor's tag, or none", () => {
		expect(actorKind({ actor: { _tag: "SystemActor" } })).toBe("SystemActor");
		expect(actorKind({ actor: { id: 1 } })).toBe("none");
		expect(actorKind({ actor: null })).toBe("none");
		expect(actorKind({})).toBe("none");
	});
});
