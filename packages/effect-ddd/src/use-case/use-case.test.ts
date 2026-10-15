import { describe, expect, it } from "bun:test";
import { Effect, Exit, Schema } from "effect";
import { AccessDeniedError } from "../access-denied-error.ts";
import { Gate } from "../gate/index.ts";
import { UNIT_OUTCOME_ATTRIBUTE } from "../metrics/unit-metrics.ts";
import { permissionRef } from "../permission/permission-ref.ts";
import { PERMISSION_CHECKED_ATTRIBUTE } from "../permission/permission-tracing.ts";
import { makeUseCaseConstructor } from "./make-use-case.ts";

class UserActor extends Schema.TaggedClass<UserActor>()("UserActor", {
	userId: Schema.String,
	admin: Schema.Boolean,
}) {}

const Input = Schema.Struct({
	actor: UserActor,
	payload: Schema.Struct({ greeting: Schema.String }),
});

const UseCase = makeUseCaseConstructor({
	annotate: (input) =>
		input.actor instanceof UserActor ? { "user.id": input.actor.userId } : {},
});

const greet = UseCase.make({
	name: "greetings.greet",
	input: Input,
	gate: Gate.when<typeof Input.Type>({
		label: "admin",
		permissions: [permissionRef("actor", "admin")],
		allows: ({ actor }) => actor.admin,
	}),
	execute: ({ payload }) => Effect.succeed(`${payload.greeting}!`),
});

function run(admin: boolean) {
	return Effect.runSyncExit(
		greet.execute({
			actor: new UserActor({ userId: "u1", admin }),
			payload: { greeting: "hello" },
		}),
	);
}

/** The attributes of every span the effect opens, read through a recording tracer. */
function spanAttributes<A, E>(
	effect: Effect.Effect<A, E>,
): ReadonlyArray<ReadonlyMap<string, unknown>> {
	const spans: Array<ReadonlyMap<string, unknown>> = [];
	const tracer = Effect.runSync(Effect.tracer);
	Effect.runSyncExit(
		effect.pipe(
			Effect.withTracer({
				...tracer,
				span: (...args: Parameters<typeof tracer.span>) => {
					const span = tracer.span(...args);
					spans.push(span.attributes);
					return span;
				},
			}),
		),
	);
	return spans;
}

describe("UseCase.make", () => {
	it("keeps its declaration readable", () => {
		expect(greet.name).toBe("greetings.greet");
		expect(greet.gate.label).toBe("admin");
		expect(greet.Input).toBe(Input);
	});

	it("runs the body behind the gate", () => {
		const allowed = run(true);
		expect(Exit.isSuccess(allowed) && allowed.value).toBe("hello!");

		const refused = run(false);
		expect(Exit.isFailure(refused)).toBe(true);
		if (Exit.isFailure(refused)) {
			const error = Exit.findErrorOption(refused);
			expect(
				error._tag === "Some" && error.value instanceof AccessDeniedError,
			).toBe(true);
		}
	});

	it("annotates its span with the unit, the actor, the permissions and the outcome", () => {
		const spans = spanAttributes(
			greet.execute({
				actor: new UserActor({ userId: "u1", admin: false }),
				payload: { greeting: "hello" },
			}),
		);
		const unitSpan = spans.find(
			(span) => span.get("use_case") === "greetings.greet",
		);
		expect(unitSpan?.get("actor.kind")).toBe("UserActor");
		expect(unitSpan?.get("user.id")).toBe("u1");
		expect(unitSpan?.get(PERMISSION_CHECKED_ATTRIBUTE)).toBe("actor:admin");
		expect(unitSpan?.get(UNIT_OUTCOME_ATTRIBUTE)).toBe("denied");
	});
});
