import { Effect, Layer, Semaphore } from "effect";
import { LockManager } from "./lock-manager.ts";

/**
 * A per-process `LockManager`: one binary semaphore per key, so concurrent
 * fibers genuinely serialize. Correct for a single instance — development,
 * tests, a one-process deployment. It has no acquisition timeout and never
 * fails with `LockAcquisitionError`: a holder waits its turn. Semaphores are
 * kept for every key ever locked, which suits the bounded key sets it is
 * meant for.
 */
export const inMemoryLockManagerLayer: Layer.Layer<LockManager> = Layer.sync(
	LockManager,
	() => {
		const semaphores = new Map<string, Semaphore.Semaphore>();
		const semaphoreFor = (key: string) => {
			const existing = semaphores.get(key);
			if (existing !== undefined) {
				return existing;
			}
			const created = Semaphore.makeUnsafe(1);
			semaphores.set(key, created);
			return created;
		};
		return LockManager.of({
			withLock: (key, effect) =>
				Effect.suspend(() => Semaphore.withPermit(semaphoreFor(key))(effect)),
		});
	},
);
