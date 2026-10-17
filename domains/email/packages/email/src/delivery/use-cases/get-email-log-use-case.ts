import { UseCase } from "@voila.dev/effect-ddd";
import { Effect, Option, Schema } from "effect";
import { EmailActor } from "../../access/email-actor.ts";
import { operatorWith } from "../../access/email-gates.ts";
import { EmailLogNotFoundError } from "../errors/email-log-not-found-error.ts";
import { EmailLogRepository } from "../services/email-log-repository.ts";
import { EmailLogId } from "../value-objects/email-log-id.ts";

const Input = Schema.Struct({
	actor: EmailActor,
	payload: Schema.Struct({ emailLogId: EmailLogId }),
});

/** One logged send, bodies and outcome included. */
export const GetEmailLogUseCase = UseCase.make({
	name: "delivery.get-email-log",
	input: Input,
	gate: operatorWith<typeof Input.Type>("email.log.read"),
	execute: ({ payload }) =>
		Effect.flatMap(EmailLogRepository, (logs) =>
			logs.get(payload.emailLogId),
		).pipe(
			Effect.flatMap(
				Option.match({
					onNone: () =>
						Effect.fail(
							new EmailLogNotFoundError({ emailLogId: payload.emailLogId }),
						),
					onSome: Effect.succeed,
				}),
			),
		),
});
