import { type Context, Effect, Option } from "effect";

/**
 * The two helpers every single-aggregate action shares, wired once per
 * repository: `loadOrFail` and `transition` (load, apply, save).
 *
 * `gate` runs before the fetch so a caller cannot probe which ids exist. When
 * authorization reads the loaded aggregate instead, leave it out and gate as
 * the first step of `apply`.
 */
export function makeAggregateActions<
	Actor,
	Identifier,
	Repository,
	Id,
	Aggregate,
	LoadError,
	NotFoundError,
	SaveError,
	GateError = never,
	GateRequirements = never,
>(options: {
	readonly repository: Context.Service<Identifier, Repository>;
	readonly load: (
		repository: Repository,
		id: Id,
	) => Effect.Effect<Option.Option<Aggregate>, LoadError>;
	readonly notFoundError: (id: Id) => NotFoundError;
	/**
	 * `loaded` is the aggregate as `transition` read it, for a repository that
	 * refuses to save over a write that landed in between.
	 */
	readonly save: (
		repository: Repository,
		aggregate: Aggregate,
		loaded: Aggregate,
	) => Effect.Effect<Aggregate, SaveError>;
	readonly gate?: (
		actor: Actor,
	) => Effect.Effect<unknown, GateError, GateRequirements>;
}) {
	function loadOrFail(actor: Actor, id: Id) {
		return Effect.gen(function* () {
			if (options.gate !== undefined) {
				yield* options.gate(actor);
			}
			const repository = yield* options.repository;
			const found = yield* options.load(repository, id);
			if (Option.isNone(found)) {
				return yield* Effect.fail(options.notFoundError(id));
			}
			return found.value;
		});
	}

	function transition<MutationError, MutationRequirements = never>(
		actor: Actor,
		id: Id,
		apply: (
			aggregate: Aggregate,
		) => Effect.Effect<Aggregate, MutationError, MutationRequirements>,
	) {
		return Effect.gen(function* () {
			const aggregate = yield* loadOrFail(actor, id);
			const updated = yield* apply(aggregate);
			const repository = yield* options.repository;
			return yield* options.save(repository, updated, aggregate);
		});
	}

	return { loadOrFail, transition } as const;
}
