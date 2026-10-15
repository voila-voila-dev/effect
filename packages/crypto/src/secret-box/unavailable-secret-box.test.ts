import { describe, expect, it } from "bun:test";
import { Effect, Exit } from "effect";
import { SecretBox } from "./secret-box.ts";
import { unavailableSecretBox } from "./unavailable-secret-box.ts";

describe("unavailableSecretBox", () => {
	it("fails every seal and open with missing-key", () => {
		const missing = Exit.fail(
			expect.objectContaining({ reason: "missing-key" }),
		);
		for (const effect of [
			SecretBox.use((box) => box.seal("value", "row-1")),
			SecretBox.use((box) => box.open("v1.a.b", "row-1")),
		]) {
			expect(
				Effect.runSyncExit(effect.pipe(Effect.provide(unavailableSecretBox))),
			).toEqual(missing);
		}
	});
});
