import { describe, expect, it } from "bun:test";
import { Effect, Schema } from "effect";
import { makeCache, unreachableCache } from "./cache.test-helper.ts";
import { writeCachedValue } from "./write-cached-value.ts";

const Amount = Schema.Struct({ cents: Schema.Number.check(Schema.isInt()) });

describe("writeCachedValue", () => {
	it("stores the schema's JSON encoding", async () => {
		const cache = makeCache();
		const stored = await Effect.runPromise(
			writeCachedValue(cache, {
				key: "a",
				schema: Amount,
				value: { cents: 120 },
				ttlSeconds: 60,
			}).pipe(Effect.andThen(cache.get("a"))),
		);
		expect(JSON.parse(stored)).toStrictEqual({ cents: 120 });
	});

	it("skips a value that does not encode", async () => {
		const cache = makeCache();
		const error = await Effect.runPromise(
			writeCachedValue(cache, {
				key: "a",
				schema: Amount,
				value: { cents: 1.5 },
				ttlSeconds: 60,
			}).pipe(Effect.andThen(Effect.flip(cache.get("a")))),
		);
		expect(error._tag).toBe("CacheMissError");
	});

	it("succeeds when the backend is unreachable", async () => {
		await expect(
			Effect.runPromise(
				writeCachedValue(unreachableCache, {
					key: "a",
					schema: Amount,
					value: { cents: 1 },
					ttlSeconds: 60,
				}),
			),
		).resolves.toBeUndefined();
	});
});
