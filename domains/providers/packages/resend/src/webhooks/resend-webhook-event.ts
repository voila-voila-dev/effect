import { Schema } from "effect";

/** `to` is an array on most events and a bare string on some. */
const Recipients = Schema.Union([Schema.Array(Schema.String), Schema.String]);

/**
 * The envelope of a Resend webhook, the fields an application acts on. Every
 * field but `type` is optional: Resend adds event kinds over time, and an
 * event this schema does not know must still decode so it can be ignored.
 *
 * Check the signature first, on the raw body: Resend signs through Svix,
 * which `verifySvixSignature` from `@voila.dev/http/webhooks` checks.
 */
export const ResendWebhookEvent = Schema.Struct({
	/** `email.sent`, `email.delivered`, `email.delivery_delayed`, `email.bounced`, `email.complained`, `email.received`… */
	type: Schema.String,
	/** ISO timestamp of when the event happened at Resend. */
	created_at: Schema.optional(Schema.String),
	data: Schema.optional(
		Schema.Struct({
			/** The id `send` answered, or the id to fetch a received message by. */
			email_id: Schema.optional(Schema.String),
			/** The RFC `Message-ID` the message went out with; Resend rewrites the one you set. */
			message_id: Schema.optional(Schema.String),
			from: Schema.optional(Schema.String),
			to: Schema.optional(Recipients),
			subject: Schema.optional(Schema.String),
			bounce: Schema.optional(
				Schema.Struct({
					type: Schema.optional(Schema.String),
					subType: Schema.optional(Schema.String),
					message: Schema.optional(Schema.String),
				}),
			),
			reason: Schema.optional(Schema.String),
			/** On `email.received`: what to fetch with `getAttachment`. */
			attachments: Schema.optional(
				Schema.Array(
					Schema.Struct({
						id: Schema.optional(Schema.String),
						filename: Schema.optional(Schema.String),
						content_type: Schema.optional(Schema.String),
					}),
				),
			),
		}),
	),
});

export type ResendWebhookEvent = typeof ResendWebhookEvent.Type;

/** A parsed webhook body as a {@link ResendWebhookEvent}; none when it is not one. */
export const decodeResendWebhookEvent =
	Schema.decodeUnknownOption(ResendWebhookEvent);
