import { describe, expect, it } from "bun:test";
import { Effect } from "effect";
import { TestClock } from "effect/testing";
import { inMemoryKeyValueCacheLayer } from "./in-memory-key-value-cache.ts";
import { KeyValueCache } from "./key-value-cache.ts";

const run = <A, E>(
	use: (cache: KeyValueCache["Service"]) => Effect.Effect<A, E>,
) =>
	Effect.runPromise(
		KeyValueCache.use(use).pipe(
			Effect.provide(inMemoryKeyValueCacheLayer),
			Effect.provide(TestClock.layer()),
		),
	);

describe("inMemoryKeyValueCacheLayer", () => {
	it("returns what was set until its TTL passes, then misses", async () => {
		const result = await run((cache) =>
			Effect.gen(function* () {
				yield* cache.set("k", "v", 60);
				const before = yield* cache.get("k");
				yield* TestClock.adjust("60 seconds");
				const after = yield* Effect.flip(cache.get("k"));
				return { before, after: after._tag };
			}),
		);
		expect(result).toStrictEqual({ before: "v", after: "CacheMissError" });
	});

	it("misses a key that was never set or was deleted", async () => {
		const tags = await run((cache) =>
			Effect.gen(function* () {
				const never = yield* Effect.flip(cache.get("never"));
				yield* cache.set("k", "v", 60);
				yield* cache.delete("k");
				const deleted = yield* Effect.flip(cache.get("k"));
				return [never._tag, deleted._tag];
			}),
		);
		expect(tags).toStrictEqual(["CacheMissError", "CacheMissError"]);
	});

	it("counts within a window that keeps its first expiry, then restarts", async () => {
		const totals = await run((cache) =>
			Effect.gen(function* () {
				const first = yield* cache.increment("n", 60);
				yield* TestClock.adjust("40 seconds");
				const second = yield* cache.increment("n", 60);
				yield* TestClock.adjust("20 seconds");
				const restarted = yield* cache.increment("n", 60);
				return [first, second, restarted];
			}),
		);
		expect(totals).toStrictEqual([1, 2, 1]);
	});
});
