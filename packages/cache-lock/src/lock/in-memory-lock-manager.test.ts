import { describe, expect, it } from "bun:test";
import { Duration, Effect, Fiber } from "effect";
import { inMemoryLockManagerLayer } from "./in-memory-lock-manager.ts";
import { LockManager } from "./lock-manager.ts";
import { lockManagerContract } from "./lock-manager-contract.test-helper.ts";

const makeLocks = () =>
	LockManager.useSync((locks) => locks).pipe(
		Effect.provide(inMemoryLockManagerLayer),
	);

lockManagerContract("inMemoryLockManagerLayer", makeLocks);

describe("inMemoryLockManagerLayer", () => {
	it("waits for a long holder instead of timing out", async () => {
		const result = await Effect.runPromise(
			Effect.gen(function* () {
				const locks = yield* makeLocks();
				const holder = yield* Effect.forkChild(
					locks.withLock("k", Effect.sleep(Duration.millis(60))),
				);
				yield* Effect.sleep(Duration.millis(10));
				const waited = yield* locks.withLock("k", Effect.succeed("waited"));
				yield* Fiber.join(holder);
				return waited;
			}),
		);
		expect(result).toBe("waited");
	});
});
