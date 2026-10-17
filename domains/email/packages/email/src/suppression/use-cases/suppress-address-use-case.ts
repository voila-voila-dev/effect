import { UseCase } from "@voila.dev/effect-ddd";
import { DateTime, Effect, Schema } from "effect";
import { EmailActor } from "../../access/email-actor.ts";
import { operatorWith } from "../../access/email-gates.ts";
import { suppress } from "../lib/suppress.ts";

const Input = Schema.Struct({
	actor: EmailActor,
	payload: Schema.Struct({
		email: Schema.String,
		note: Schema.NullOr(Schema.String),
	}),
});

/**
 * Blocks an address by hand: what the provider will never report, such as a
 * role account that keeps complaining or someone who asked over the phone.
 * Always `ManualBlock`, so the list says which entries a person decided on.
 */
export const SuppressAddressUseCase = UseCase.make({
	name: "suppression.suppress-address",
	input: Input,
	gate: operatorWith<typeof Input.Type>("email.suppression.manage"),
	execute: ({ payload }) =>
		Effect.gen(function* () {
			return yield* suppress({
				email: payload.email,
				reason: "ManualBlock",
				sourceEmailLogId: null,
				providerDetail: null,
				note: payload.note,
				at: yield* DateTime.now,
			});
		}),
});
