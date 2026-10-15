import { describe, expect, it } from "bun:test";
import { Effect } from "effect";
import { permissionRef } from "./permission-ref.ts";
import {
	checked,
	PERMISSION_CHECKED_ATTRIBUTE,
	splitPermissionChecked,
} from "./permission-tracing.ts";

function checkedAttribute(effect: Effect.Effect<unknown>): unknown {
	return Effect.runSync(
		effect.pipe(
			Effect.andThen(Effect.currentSpan),
			Effect.map((span) => span.attributes.get(PERMISSION_CHECKED_ATTRIBUTE)),
			Effect.withSpan("test"),
		),
	);
}

describe("checked", () => {
	it("appends every permission checked during the call", () => {
		const first = checked([permissionRef("actor", "user")])(Effect.void);
		const second = checked([permissionRef("organization", "invoice.read")])(
			Effect.void,
		);
		expect(checkedAttribute(Effect.andThen(first, second))).toBe(
			"actor:user,organization:invoice.read",
		);
	});

	it("records even when the fence fails", () => {
		const refused = checked([permissionRef("actor", "admin")])(
			Effect.fail("denied"),
		);
		expect(checkedAttribute(Effect.ignore(refused))).toBe("actor:admin");
	});

	it("runs the fence alone when no span is open", () => {
		expect(Effect.runSync(checked([])(Effect.succeed(1)))).toBe(1);
	});
});

describe("splitPermissionChecked", () => {
	it("reads the attribute back, and nothing from a missing one", () => {
		expect(splitPermissionChecked("a:b,c:d")).toStrictEqual(["a:b", "c:d"]);
		expect(splitPermissionChecked(undefined)).toStrictEqual([]);
		expect(splitPermissionChecked("")).toStrictEqual([]);
	});
});
