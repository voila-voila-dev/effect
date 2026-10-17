import { describe, expect, it } from "bun:test";
import { Duration, Effect, Fiber } from "effect";
import type { LockManager } from "./lock-manager.ts";

// One suite every `LockManager` runs, so the in-memory twin and the
// distributed implementations cannot drift apart on what a caller relies on.
// Acquisition timeouts are not part of it: only distributed locks have one.

type MakeLocks = () => Effect.Effect<LockManager["Service"]>;

const overlap = (
	locks: LockManager["Service"],
	keys: readonly [string, string],
) =>
	Effect.gen(function* () {
		let active = 0;
		let observedMax = 0;
		const critical = Effect.gen(function* () {
			active += 1;
			observedMax = Math.max(observedMax, active);
			yield* Effect.sleep(Duration.millis(20));
			active -= 1;
		});
		yield* Effect.all(
			keys.map((key) => locks.withLock(key, critical)),
			{ concurrency: "unbounded" },
		);
		return observedMax;
	});

export function lockManagerContract(name: string, makeLocks: MakeLocks) {
	const run = <A, E>(
		use: (locks: LockManager["Service"]) => Effect.Effect<A, E>,
	) => Effect.runPromise(Effect.flatMap(makeLocks(), use));

	describe(`${name} (LockManager contract)`, () => {
		it("returns the guarded effect's result", async () => {
			expect(
				await run((locks) => locks.withLock("k", Effect.succeed(42))),
			).toBe(42);
		});

		it("keeps the effect's failure and frees the key for the next holder", async () => {
			const result = await run((locks) =>
				Effect.gen(function* () {
					const failure = yield* Effect.flip(
						locks.withLock("k", Effect.fail("boom" as const)),
					);
					const after = yield* locks.withLock("k", Effect.succeed("after"));
					return { failure, after };
				}),
			);
			expect(result).toStrictEqual({ failure: "boom", after: "after" });
		});

		it("serializes two holders of the same key", async () => {
			expect(await run((locks) => overlap(locks, ["k", "k"]))).toBe(1);
		});

		it("does not serialize holders of different keys", async () => {
			expect(await run((locks) => overlap(locks, ["a", "b"]))).toBe(2);
		});

		it("releases the key when the holder is interrupted", async () => {
			const result = await run((locks) =>
				Effect.gen(function* () {
					const holder = yield* Effect.forkChild(
						locks.withLock("k", Effect.never),
					);
					yield* Effect.sleep(Duration.millis(10));
					yield* Fiber.interrupt(holder);
					return yield* locks.withLock("k", Effect.succeed("after"));
				}),
			);
			expect(result).toBe("after");
		});
	});
}
