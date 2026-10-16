import { describe, expect, it } from "bun:test";
import { Effect } from "effect";
import { LockManager } from "../lock/lock-manager.ts";
import { lockManagerContract } from "../lock/lock-manager-contract.test-helper.ts";
import { makeFakeRedis } from "./fake-redis.test-helper.ts";
import {
	REDIS_URL,
	realRedisLayer,
	runPrefix,
} from "./real-redis.test-helper.ts";
import {
	makeRedisLockManager,
	redisLockManagerLayer,
} from "./redis-lock-manager.ts";

const fast = { retryDelay: "2 millis", acquireTimeout: "2 seconds" } as const;

lockManagerContract("makeRedisLockManager", () =>
	Effect.sync(() => makeRedisLockManager(makeFakeRedis().redis, fast)),
);

const url = REDIS_URL;
if (url !== undefined) {
	lockManagerContract("redisLockManagerLayer on a real Redis", () =>
		LockManager.useSync((locks) => locks).pipe(
			Effect.provide(redisLockManagerLayer({ ...fast, prefix: runPrefix() })),
			Effect.provide(realRedisLayer(url)),
		),
	);
}

describe("makeRedisLockManager", () => {
	it("holds the key, with a lease, only while the effect runs", async () => {
		const { redis, store, sent } = makeFakeRedis();
		const locks = makeRedisLockManager(redis, { lease: "5 seconds" });
		const heldDuring = await Effect.runPromise(
			locks.withLock(
				"k",
				Effect.sync(() => store.has("lock:k")),
			),
		);
		expect(heldDuring).toBe(true);
		expect(store.has("lock:k")).toBe(false);
		expect(sent[0]?.args.slice(2)).toStrictEqual(["NX", "PX", "5000"]);
	});

	it("fails with LockAcquisitionError once the key stays held past the timeout", async () => {
		const { redis, store } = makeFakeRedis();
		store.set("lock:k", "someone-else");
		const locks = makeRedisLockManager(redis, {
			acquireTimeout: "20 millis",
			retryDelay: "2 millis",
		});
		const error = await Effect.runPromise(
			Effect.flip(locks.withLock("k", Effect.succeed("never"))),
		);
		expect(error._tag).toBe("LockAcquisitionError");
		expect(store.get("lock:k")).toBe("someone-else");
	});

	it("never deletes a lock that another holder took over after the lease", async () => {
		const { redis, store } = makeFakeRedis();
		const locks = makeRedisLockManager(redis);
		await Effect.runPromise(
			locks.withLock(
				"k",
				Effect.sync(() => store.set("lock:k", "next-holder")),
			),
		);
		expect(store.get("lock:k")).toBe("next-holder");
	});
});
