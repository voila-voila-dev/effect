import { UseCase } from "@voila.dev/effect-ddd";
import { DateTime, Effect, Option, Schema } from "effect";
import { EmailActor } from "../../access/email-actor.ts";
import { operatorWith } from "../../access/email-gates.ts";
import { EmailIds } from "../../ids/email-ids.ts";
import { EmailLogNotFoundError } from "../errors/email-log-not-found-error.ts";
import { enqueueEmail } from "../lib/enqueue-email.ts";
import { EmailLogRepository } from "../services/email-log-repository.ts";
import { EmailLogId } from "../value-objects/email-log-id.ts";

const Input = Schema.Struct({
	actor: EmailActor,
	payload: Schema.Struct({ emailLogId: EmailLogId }),
});

/**
 * Sends a logged message again, as a new log pointing at the first, so each
 * delivery keeps its own outcome. It goes through the outbox and the
 * suppression list like any send: a resend to a suppressed address is
 * settled `suppressed`, not forced through. Answers the new log's id.
 */
export const ResendEmailUseCase = UseCase.make({
	name: "delivery.resend-email",
	input: Input,
	gate: operatorWith<typeof Input.Type>("email.log.resend"),
	execute: ({ payload }) =>
		Effect.gen(function* () {
			const logs = yield* EmailLogRepository;
			const original = yield* logs.get(payload.emailLogId);
			if (Option.isNone(original)) {
				return yield* new EmailLogNotFoundError({
					emailLogId: payload.emailLogId,
				});
			}
			const ids = yield* EmailIds;
			const id = EmailLogId.make(yield* ids.next);
			yield* enqueueEmail(original.value.resendFacts(id, yield* DateTime.now));
			return id;
		}),
});
