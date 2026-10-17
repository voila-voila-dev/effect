import { UseCase } from "@voila.dev/effect-ddd";
import { DateTime, Effect, Option, Schema } from "effect";
import { EmailActor } from "../../access/email-actor.ts";
import { system } from "../../access/email-gates.ts";
import { EmailIds } from "../../ids/email-ids.ts";
import { EmailMessage } from "../../message/value-objects/email-message.ts";
import { EmailSendingStream } from "../../message/value-objects/email-sending-stream.ts";
import { enqueueEmail } from "../lib/enqueue-email.ts";
import { EmailLogRepository } from "../services/email-log-repository.ts";
import { EmailLogId } from "../value-objects/email-log-id.ts";

const Input = Schema.Struct({
	actor: EmailActor,
	payload: Schema.Struct({
		message: EmailMessage,
		stream: EmailSendingStream,
		/** Names the send when it may be asked for twice; the second ask sends nothing. */
		dedupeKey: Schema.optionalKey(Schema.String),
	}),
});

/**
 * The way the application mails someone: the message goes through the outbox
 * and the log, never straight to the provider, so every send is retried until
 * it settles and leaves a record whatever happens to it. Answers the log's id.
 *
 * A refused attempt is not the caller's error: the outbox owns the retry
 * curve, and a message that exhausts it shows as `failed` in the log.
 */
export const SendEmailUseCase = UseCase.make({
	name: "delivery.send-email",
	input: Input,
	gate: system<typeof Input.Type>(),
	execute: ({ payload }) =>
		Effect.gen(function* () {
			const repository = yield* EmailLogRepository;
			if (payload.dedupeKey !== undefined) {
				const existing = yield* repository.findByDedupeKey(payload.dedupeKey);
				if (Option.isSome(existing)) return existing.value.id;
			}
			const ids = yield* EmailIds;
			const id = EmailLogId.make(yield* ids.next);
			yield* enqueueEmail({
				id,
				message: payload.message,
				stream: payload.stream,
				resendOfId: null,
				dedupeKey: payload.dedupeKey ?? null,
				createdAt: yield* DateTime.now,
			});
			return id;
		}),
});
