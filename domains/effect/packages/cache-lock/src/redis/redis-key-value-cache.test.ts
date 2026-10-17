import { describe, expect, it } from "bun:test";
import { Effect } from "effect";
import { KeyValueCache } from "../cache/key-value-cache.ts";
import {
	makeFakeRedis,
	makeUnreachableRedis,
} from "./fake-redis.test-helper.ts";
import {
	REDIS_URL,
	realRedisLayer,
	runPrefix,
} from "./real-redis.test-helper.ts";
import {
	makeRedisKeyValueCache,
	redisKeyValueCacheLayer,
} from "./redis-key-value-cache.ts";

describe("makeRedisKeyValueCache", () => {
	it("round-trips under the prefix, with the TTL as EX seconds", async () => {
		const { redis, store, sent } = makeFakeRedis();
		const cache = makeRedisKeyValueCache(redis, { prefix: "app:" });
		const value = await Effect.runPromise(
			cache.set("k", "v", 45).pipe(Effect.andThen(cache.get("k"))),
		);
		expect(value).toBe("v");
		expect(store.get("app:k")).toBe("v");
		expect(sent[0]).toStrictEqual({
			command: "SET",
			args: ["app:k", "v", "EX", "45"],
		});
	});

	it("misses an absent key and deletes one without complaint", async () => {
		const { redis } = makeFakeRedis();
		const cache = makeRedisKeyValueCache(redis);
		const error = await Effect.runPromise(
			cache.delete("gone").pipe(Effect.andThen(Effect.flip(cache.get("gone")))),
		);
		expect(error._tag).toBe("CacheMissError");
	});

	it("increments through one script call", async () => {
		const { redis, sent } = makeFakeRedis();
		const cache = makeRedisKeyValueCache(redis);
		const totals = await Effect.runPromise(
			Effect.all([cache.increment("n", 60), cache.increment("n", 60)]),
		);
		expect(totals).toStrictEqual([1, 2]);
		expect(sent.filter(({ command }) => command === "EVALSHA")).toHaveLength(2);
	});

	it("fails every command with CacheTransportError when Redis is down", async () => {
		const cache = makeRedisKeyValueCache(makeUnreachableRedis());
		const tags = await Effect.runPromise(
			Effect.all(
				[
					Effect.asVoid(cache.get("k")),
					cache.set("k", "v", 60),
					Effect.asVoid(cache.increment("k", 60)),
					cache.delete("k"),
				].map((effect) => Effect.map(Effect.flip(effect), (e) => e._tag)),
			),
		);
		expect(tags).toStrictEqual(Array(4).fill("CacheTransportError"));
	});
});

describe.skipIf(REDIS_URL === undefined)(
	"redisKeyValueCacheLayer on a real Redis",
	() => {
		it("expires a counter after its first TTL", async () => {
			const totals = await Effect.runPromise(
				KeyValueCache.use((cache) =>
					Effect.gen(function* () {
						const first = yield* cache.increment("n", 1);
						const second = yield* cache.increment("n", 1);
						yield* Effect.sleep("1100 millis");
						const restarted = yield* cache.increment("n", 1);
						return [first, second, restarted];
					}),
				).pipe(
					Effect.provide(redisKeyValueCacheLayer({ prefix: runPrefix() })),
					Effect.provide(realRedisLayer(REDIS_URL ?? "")),
				),
			);
			expect(totals).toStrictEqual([1, 2, 1]);
		});
	},
);
