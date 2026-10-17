import { UseCase } from "@voila.dev/effect-ddd";
import { Effect, Option, Schema } from "effect";
import { EmailActor } from "../../access/email-actor.ts";
import { operatorWith } from "../../access/email-gates.ts";
import { InboundEmailNotFoundError } from "../errors/inbound-email-not-found-error.ts";
import { InboundEmailRepository } from "../services/inbound-email-repository.ts";
import { InboundEmailId } from "../value-objects/inbound-email-id.ts";

const Input = Schema.Struct({
	actor: EmailActor,
	payload: Schema.Struct({ inboundEmailId: InboundEmailId }),
});

/** One received message, body, headers and verdict included. */
export const GetInboundEmailUseCase = UseCase.make({
	name: "inbound.get-inbound-email",
	input: Input,
	gate: operatorWith<typeof Input.Type>("email.inbound.read"),
	execute: ({ payload }) =>
		Effect.flatMap(InboundEmailRepository, (repository) =>
			repository.get(payload.inboundEmailId),
		).pipe(
			Effect.flatMap(
				Option.match({
					onNone: () =>
						Effect.fail(
							new InboundEmailNotFoundError({
								inboundEmailId: payload.inboundEmailId,
							}),
						),
					onSome: Effect.succeed,
				}),
			),
		),
});
