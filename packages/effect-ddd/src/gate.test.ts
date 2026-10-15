import { describe, expect, it } from "bun:test";
import { Effect, Exit, Option, Schema } from "effect";
import { AccessDeniedError } from "./access-denied-error.ts";
import { Gate, gateHolds } from "./gate.ts";
import { permissionRef } from "./permission-ref.ts";

interface Input {
	readonly role: string;
}

function roleGate(role: string) {
	return Gate.when<Input>({
		label: `role ${role}`,
		permissions: [permissionRef("role", role)],
		allows: (input) => input.role === role,
	});
}

const isDenied = Schema.is(AccessDeniedError);

function denied(gate: Gate<Input>, input: Input): boolean {
	const exit = Effect.runSyncExit(gate.check(input));
	return (
		Exit.isFailure(exit) &&
		isDenied(Option.getOrUndefined(Exit.findErrorOption(exit)))
	);
}

describe("Gate", () => {
	it("lets anyone through an open gate", () => {
		const gate = Gate.anyone<Input>();
		expect(Exit.isSuccess(Effect.runSyncExit(gate.check({ role: "x" })))).toBe(
			true,
		);
		expect(gate.permissions).toStrictEqual([{ kind: "actor", name: "anyone" }]);
		expect(Gate.bearer("the exchange code").label).toBe(
			"bearer of the exchange code",
		);
	});

	it("refuses with AccessDeniedError when the predicate is false", () => {
		expect(denied(roleGate("admin"), { role: "member" })).toBe(true);
		expect(denied(roleGate("admin"), { role: "admin" })).toBe(false);
	});

	it("composes with either and all", () => {
		const either = Gate.either(roleGate("admin"), roleGate("owner"));
		expect(either.label).toBe("role admin or role owner");
		expect(denied(either, { role: "owner" })).toBe(false);
		expect(denied(either, { role: "member" })).toBe(true);

		const all = Gate.all(roleGate("admin"), Gate.anyone<Input>());
		expect(all.permissions).toHaveLength(2);
		expect(denied(all, { role: "member" })).toBe(true);
	});

	it("answers gateHolds without failing", () => {
		expect(
			Effect.runSync(gateHolds(roleGate("admin"), { role: "admin" })),
		).toBe(true);
		expect(
			Effect.runSync(gateHolds(roleGate("admin"), { role: "member" })),
		).toBe(false);
	});
});
