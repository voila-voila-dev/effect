import { UseCase } from "@voila.dev/effect-ddd";
import { Effect, Schema } from "effect";
import { EmailActor } from "../../access/email-actor.ts";
import { operatorWithOrSystem } from "../../access/email-gates.ts";
import { deliverClaimedEmail } from "../lib/deliver-claimed-email.ts";
import { EmailLogRepository } from "../services/email-log-repository.ts";

/**
 * Logs per pass. The claim takes the most urgent stream first, so under a
 * backlog a bounded pass sends the sign-in codes and leaves the campaign tail
 * for the next tick.
 */
const SWEEP_BATCH_SIZE = 100;

/** What one pass did, for the scheduler's log. */
export interface EmailOutboxResult {
	readonly processed: number;
	readonly sent: number;
	readonly suppressed: number;
	readonly retryScheduled: number;
	readonly failed: number;
}

const Input = Schema.Struct({ actor: EmailActor });

/**
 * The outbox's safety net, run on a schedule. Every send makes its first
 * attempt inline; this picks up what that could not finish: logs whose
 * process died mid-attempt (their lease expired) and failed attempts due
 * again on the retry curve. On a healthy system a pass claims nothing. One
 * message at a time, so a poison message cannot sink the others.
 */
export const ProcessEmailOutboxUseCase = UseCase.make({
	name: "delivery.process-email-outbox",
	input: Input,
	gate: operatorWithOrSystem<typeof Input.Type>("email.outbox.process"),
	execute: () =>
		Effect.gen(function* () {
			const repository = yield* EmailLogRepository;
			const claimed = yield* repository.claimDuePending(SWEEP_BATCH_SIZE);
			const outcomes = { sent: 0, suppressed: 0, retryScheduled: 0, failed: 0 };
			yield* Effect.forEach(
				claimed,
				(log) =>
					Effect.map(deliverClaimedEmail(log), (outcome) => {
						outcomes[outcome] += 1;
					}),
				{ concurrency: 1, discard: true },
			);
			return {
				processed: claimed.length,
				...outcomes,
			} satisfies EmailOutboxResult;
		}),
});
