import { EmailSendError, EmailSender } from "@voila.dev/email";
import {
	decodeJsonResponse,
	ensureSuccess,
	isRateLimited,
	OutboundTimeout,
	outboundCall,
	RetryPolicy,
	retryOutbound,
	sendOutbound,
	withTimeout,
} from "@voila.dev/http";
import { Config, Effect, Layer, Redacted, Schema, Semaphore } from "effect";
import { describeOutboundFailure } from "../describe-outbound-failure.ts";
import { resendPayload } from "./resend-payload.ts";
import { sendPlan } from "./send-plan.ts";

const API_BASE_URL = "https://api.resend.com";

const Sent = Schema.Struct({ id: Schema.String });
const BatchSent = Schema.Struct({ data: Schema.Array(Sent) });

export interface ResendEmailSenderOptions {
	readonly apiKey: Redacted.Redacted<string>;
	/**
	 * The partner the requests go out as, which picks the `fetch` from
	 * `OutboundFetch` and names the span and the request log entry. `resend`
	 * unless told otherwise.
	 */
	readonly partner?: string;
	/**
	 * Requests in flight at once from this sender; 5 by default. Resend
	 * allows a few requests per second per team, shared by every process on
	 * the key: two instances at 5 each stay at the cap instead of past it.
	 */
	readonly maxConcurrentRequests?: number;
	/** The backoff for a 429; `RetryPolicy.rateLimited` by default. */
	readonly rateLimitedRetry?: RetryPolicy;
}

/**
 * An {@link EmailSender} on Resend's API. A 429 is retried with a backoff:
 * Resend did not take the message, so retrying cannot send it twice. Nothing
 * else is retried, a 5xx or a timeout included, since the message may have
 * gone out; the caller (an outbox) decides.
 */
export function makeResendEmailSender(
	options: ResendEmailSenderOptions,
): typeof EmailSender.Service {
	const partner = options.partner ?? "resend";
	const requests = Semaphore.makeUnsafe(options.maxConcurrentRequests ?? 5);
	const rateLimitedRetry = options.rateLimitedRetry ?? RetryPolicy.rateLimited;

	const post = <S extends Schema.Top>(
		path: string,
		body: unknown,
		answer: S,
		operation: string,
	) =>
		sendOutbound(partner, `${API_BASE_URL}${path}`, {
			method: "POST",
			headers: {
				authorization: `Bearer ${Redacted.value(options.apiKey)}`,
				"content-type": "application/json",
			},
			body: JSON.stringify(body),
		}).pipe(
			Effect.flatMap(ensureSuccess),
			Effect.flatMap(decodeJsonResponse(answer)),
			withTimeout(OutboundTimeout.roundTrip),
			// The permit covers one attempt, not the backoff: a fiber waiting
			// out a 429 must not hold a slot another send could use.
			Semaphore.withPermit(requests),
			retryOutbound(rateLimitedRetry, { when: isRateLimited }),
			Effect.mapError(
				(error) =>
					new EmailSendError({
						message: `Resend ${describeOutboundFailure(error)}`,
					}),
			),
			outboundCall({ partner, operation }),
		);

	const send = (message: Parameters<typeof resendPayload>[0]) =>
		post("/emails", resendPayload(message), Sent, "send").pipe(
			Effect.map(({ id }) => id),
		);

	return {
		send,
		sendMany: (messages) =>
			Effect.forEach(sendPlan(messages), (step) =>
				step.kind === "single"
					? Effect.map(send(step.message), (id) => [id])
					: post(
							"/emails/batch",
							step.messages.map(resendPayload),
							BatchSent,
							"send-batch",
						).pipe(Effect.map(({ data }) => data.map(({ id }) => id))),
			).pipe(Effect.map((ids) => ids.flat())),
	};
}

/** {@link makeResendEmailSender} as the `EmailSender` layer. */
export function resendEmailSenderLayer(
	options: ResendEmailSenderOptions,
): Layer.Layer<EmailSender> {
	return Layer.sync(EmailSender, () => makeResendEmailSender(options));
}

/** {@link resendEmailSenderLayer} with the key read from `RESEND_API_KEY`. */
export const resendEmailSenderFromConfig: Layer.Layer<
	EmailSender,
	Config.ConfigError
> = Layer.unwrap(
	Effect.map(Config.Redacted("RESEND_API_KEY"), (apiKey) =>
		resendEmailSenderLayer({ apiKey }),
	),
);
