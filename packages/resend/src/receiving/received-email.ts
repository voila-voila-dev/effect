import { Schema } from "effect";

/**
 * What the receiving side concluded about one check (SPF, DKIM, DMARC).
 * `Unknown` is both "not reported" and "reported as something unrecognised":
 * either way nothing is known, and a fabricated pass would be worse.
 */
export const AuthenticationVerdict = Schema.Literals([
	"Pass",
	"Fail",
	"Unknown",
]);

export type AuthenticationVerdict = typeof AuthenticationVerdict.Type;

/** The body and verdicts of a received message, which the `email.received` webhook does not carry. */
export interface ReceivedEmail {
	readonly text: string;
	readonly html: string | null;
	readonly spf: AuthenticationVerdict;
	readonly dkim: AuthenticationVerdict;
	readonly dmarc: AuthenticationVerdict;
	/** Header names lowercased, whatever casing the sender used. */
	readonly headers: Readonly<Record<string, string>>;
}

export interface ReceivedAttachment {
	readonly bytes: Uint8Array;
	/** As Resend reported it; `application/octet-stream` when it did not. */
	readonly contentType: string;
}

/** Resend could not hand back a received message or one of its attachments. */
export class ResendReceivingError extends Schema.TaggedError<ResendReceivingError>()(
	"ResendReceivingError",
	{ message: Schema.String },
) {}
