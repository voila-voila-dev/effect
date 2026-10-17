import { UseCase } from "@voila.dev/effect-ddd";
import { Effect, Schema } from "effect";
import { EmailActor } from "../../access/email-actor.ts";
import { operatorWith } from "../../access/email-gates.ts";
import { normalizeEmailAddress } from "../../message/lib/normalize-email-address.ts";
import { SuppressionList } from "../services/suppression-list.ts";

const Input = Schema.Struct({
	actor: EmailActor,
	payload: Schema.Struct({ email: Schema.String }),
});

/**
 * Lets a suppressed address be mailed again. A delete rather than a
 * "released" flag: every send consults the list, and an absent row is one
 * condition nobody can get wrong. Releasing an address that is not on the list
 * succeeds and does nothing.
 */
export const ReleaseSuppressedAddressUseCase = UseCase.make({
	name: "suppression.release-suppressed-address",
	input: Input,
	gate: operatorWith<typeof Input.Type>("email.suppression.manage"),
	execute: ({ payload }) =>
		Effect.flatMap(SuppressionList, (suppressions) =>
			suppressions.delete(normalizeEmailAddress(payload.email)),
		),
});
