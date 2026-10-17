import { UseCase } from "@voila.dev/effect-ddd";
import { DateTime, Effect, Option, Schema } from "effect";
import { EmailActor } from "../../access/email-actor.ts";
import { system } from "../../access/email-gates.ts";
import { EmailLogRepository } from "../services/email-log-repository.ts";
import { EmailLogId } from "../value-objects/email-log-id.ts";

const Input = Schema.Struct({
	actor: EmailActor,
	payload: Schema.Struct({ emailLogId: EmailLogId }),
});

/**
 * Records that a message was opened, from the application's tracking pixel.
 * The first open is kept; an unknown id is ignored, since a pixel is public
 * and a forged one must not fail loudly.
 */
export const RecordEmailOpenUseCase = UseCase.make({
	name: "delivery.record-email-open",
	input: Input,
	gate: system<typeof Input.Type>(),
	execute: ({ payload }) =>
		Effect.gen(function* () {
			const logs = yield* EmailLogRepository;
			const log = yield* logs.get(payload.emailLogId);
			if (Option.isNone(log) || log.value.openedAt !== null) return;
			yield* logs.save(log.value.opened(yield* DateTime.now));
		}),
});
