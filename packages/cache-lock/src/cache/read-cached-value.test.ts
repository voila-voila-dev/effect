import { describe, expect, it } from "bun:test";
import { Effect, Option, Schema } from "effect";
import { makeCache, unreachableCache } from "./cache.test-helper.ts";
import { readCachedValue } from "./read-cached-value.ts";

const Point = Schema.Struct({ x: Schema.Number, y: Schema.Number });

describe("readCachedValue", () => {
	it("decodes a cached entry", async () => {
		const cache = makeCache();
		const value = await Effect.runPromise(
			cache
				.set("p", JSON.stringify({ x: 1, y: 2 }), 60)
				.pipe(Effect.andThen(readCachedValue(cache, "p", Point))),
		);
		expect(value).toStrictEqual(Option.some({ x: 1, y: 2 }));
	});

	it("reads a miss, malformed JSON and an outdated shape as absent", async () => {
		const cache = makeCache();
		const values = await Effect.runPromise(
			Effect.gen(function* () {
				yield* cache.set("broken", "{not json", 60);
				yield* cache.set("outdated", JSON.stringify({ x: "1" }), 60);
				return yield* Effect.all(
					["missing", "broken", "outdated"].map((key) =>
						readCachedValue(cache, key, Point),
					),
				);
			}),
		);
		expect(values).toStrictEqual([Option.none(), Option.none(), Option.none()]);
	});

	it("reads an unreachable backend as absent", async () => {
		const value = await Effect.runPromise(
			readCachedValue(unreachableCache, "p", Point),
		);
		expect(value).toStrictEqual(Option.none());
	});
});
