import { UseCase } from "@voila.dev/effect-ddd";
import { Effect, Option, Schema } from "effect";
import { EmailActor } from "../../access/email-actor.ts";
import { system } from "../../access/email-gates.ts";
import { EmailLogRepository } from "../../delivery/services/email-log-repository.ts";
import { InboundEmail } from "../aggregates/inbound-email.ts";
import {
	localPartOf,
	threadedMessageIds,
} from "../lib/threaded-message-ids.ts";
import {
	headersLookAutomated,
	senderLooksAutomated,
} from "../policies/automated-mail.ts";
import { InboundEmailHandler } from "../services/inbound-email-handler.ts";
import { InboundEmailRepository } from "../services/inbound-email-repository.ts";
import { InboundEmailSettings } from "../services/inbound-email-settings.ts";
import { ReplyAddresses } from "../services/reply-addresses.ts";

const Input = Schema.Struct({
	actor: EmailActor,
	payload: Schema.Struct({ inbound: InboundEmail }),
});

/** The payload a reply address carries, or null when it is not one of ours. */
function payloadOf(address: string) {
	const localPart = localPartOf(address);
	if (localPart === null) return Effect.succeed(null);
	return Effect.flatMap(ReplyAddresses, (replyAddresses) =>
		replyAddresses.verify(localPart),
	).pipe(
		Effect.map((payload): string | null => payload),
		Effect.catchTag("InvalidReplyTokenError", () => Effect.succeed(null)),
	);
}

/**
 * The reply address of the send this message answers, found by the
 * `Message-ID` it quotes and verified like any other: clients mangle a
 * `Reply-To`, and some people answer by writing to the sender, but they quote
 * the message they answer. Re-verifying keeps one path and the token's expiry.
 */
function payloadByThreading(inbound: InboundEmail) {
	return Effect.gen(function* () {
		const logs = yield* EmailLogRepository;
		for (const messageId of threadedMessageIds(inbound.headers)) {
			const log = yield* logs.findByRfcMessageId(messageId);
			for (const replyTo of Option.match(log, {
				onNone: () => [],
				onSome: (found) => found.message.replyTo ?? [],
			})) {
				const payload = yield* payloadOf(replyTo);
				if (payload !== null) return payload;
			}
		}
		return null;
	});
}

/**
 * Decides what a stored message means and records the verdict on it. The
 * order is the security model:
 *
 * 1. A message already decided is answered as it is: a redelivered webhook
 *    must not post a reply twice.
 * 2. The loop guard runs before the token: an auto-responder answering our
 *    notification carries our own valid reply address.
 * 3. The reply address must verify; failing that, the send it answers (by its
 *    `Message-ID`) may give the address back.
 * 4. The application's {@link InboundEmailHandler} decides what the payload
 *    means, and owns the sender and DMARC checks.
 */
export const RouteInboundEmailUseCase = UseCase.make({
	name: "inbound.route-inbound-email",
	input: Input,
	gate: system<typeof Input.Type>(),
	execute: ({ payload: { inbound } }) =>
		Effect.gen(function* () {
			if (inbound.isRouted) return inbound;
			const repository = yield* InboundEmailRepository;
			const settings = yield* InboundEmailSettings;

			if (
				senderLooksAutomated(inbound.from, settings.ownDomains) ||
				headersLookAutomated(inbound.headers)
			) {
				return yield* repository.save(inbound.withOutcome("rejected", null));
			}

			const verified =
				(yield* payloadOf(inbound.to)) ?? (yield* payloadByThreading(inbound));
			if (verified === null) {
				return yield* repository.save(inbound.withOutcome("unroutable", null));
			}

			const handler = yield* InboundEmailHandler;
			const outcome = yield* handler.handle({ inbound, payload: verified });
			return yield* repository.save(
				inbound.withOutcome(outcome.status, outcome.reference),
			);
		}),
});
