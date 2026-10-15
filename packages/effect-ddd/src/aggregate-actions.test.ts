import { describe, expect, it } from "bun:test";
import { Context, Effect, Exit, Layer, Option } from "effect";
import { makeAggregateActions } from "./aggregate-actions.ts";

interface Counter {
	readonly id: string;
	readonly value: number;
}

class CounterRepository extends Context.Service<
	CounterRepository,
	{
		readonly get: (id: string) => Effect.Effect<Option.Option<Counter>>;
		readonly save: (counter: Counter) => Effect.Effect<Counter>;
	}
>()("CounterRepository") {}

const store = new Map([["a", { id: "a", value: 1 }]]);
const repository = Layer.succeed(CounterRepository, {
	get: (id) => Effect.succeed(Option.fromNullishOr(store.get(id))),
	save: (counter) =>
		Effect.sync(() => {
			store.set(counter.id, counter);
			return counter;
		}),
});

const counters = makeAggregateActions({
	repository: CounterRepository,
	load: (repo, id: string) => repo.get(id),
	notFoundError: (id) => `missing ${id}`,
	save: (repo, counter: Counter) => repo.save(counter),
	gate: (actor: { readonly allowed: boolean }) =>
		actor.allowed ? Effect.void : Effect.fail("denied" as const),
});

describe("makeAggregateActions", () => {
	it("loads, applies and saves", () => {
		const result = Effect.runSync(
			counters
				.transition({ allowed: true }, "a", (counter) =>
					Effect.succeed({ ...counter, value: counter.value + 1 }),
				)
				.pipe(Effect.provide(repository)),
		);
		expect(result.value).toBe(2);
		expect(store.get("a")?.value).toBe(2);
	});

	it("gates before it loads, then fails on a missing id", () => {
		const refused = Effect.runSyncExit(
			counters
				.loadOrFail({ allowed: false }, "zzz")
				.pipe(Effect.provide(repository)),
		);
		expect(
			Exit.isFailure(refused) &&
				Option.getOrNull(Exit.findErrorOption(refused)),
		).toBe("denied");

		const missing = Effect.runSyncExit(
			counters
				.loadOrFail({ allowed: true }, "zzz")
				.pipe(Effect.provide(repository)),
		);
		expect(
			Exit.isFailure(missing) &&
				Option.getOrNull(Exit.findErrorOption(missing)),
		).toBe("missing zzz");
	});
});
