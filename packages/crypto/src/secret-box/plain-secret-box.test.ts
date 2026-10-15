import { describe, expect, it } from "bun:test";
import { Effect, Exit } from "effect";
import { plainSealed, plainSecretBox } from "./plain-secret-box.ts";
import { SecretBox } from "./secret-box.ts";

function run<A, E>(effect: Effect.Effect<A, E, SecretBox>) {
	return Effect.runSyncExit(effect.pipe(Effect.provide(plainSecretBox)));
}

describe("plainSecretBox", () => {
	it("seals into the text plainSealed predicts", () => {
		expect(run(SecretBox.use((box) => box.seal("value", "row-1")))).toEqual(
			Exit.succeed(plainSealed("value", "row-1")),
		);
	});

	it("opens a planted value", () => {
		expect(
			run(
				SecretBox.use((box) =>
					box.open(plainSealed("value", "row-1"), "row-1"),
				),
			),
		).toEqual(Exit.succeed("value"));
	});

	it("refuses a text bound to another record", () => {
		expect(
			run(
				SecretBox.use((box) =>
					box.open(plainSealed("value", "row-1"), "row-2"),
				),
			),
		).toEqual(Exit.fail(expect.objectContaining({ reason: "unreadable" })));
	});
});
