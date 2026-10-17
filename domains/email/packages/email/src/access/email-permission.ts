import { Schema } from "effect";

/**
 * What an operator may do with the email domain. The application maps its own
 * roles onto these when it builds an {@link EmailOperator}.
 */
export const EMAIL_PERMISSIONS = [
	/** Read the log of sent mail, one message with its bodies included. */
	"email.log.read",
	/** Send a logged message again. */
	"email.log.resend",
	/** Read, add to and release the suppression list. */
	"email.suppression.manage",
	/** Run the outbox sweep by hand. */
	"email.outbox.process",
	/** Read the received mail, bodies included. */
	"email.inbound.read",
] as const;

export const EmailPermission = Schema.Literals(EMAIL_PERMISSIONS);

export type EmailPermission = typeof EmailPermission.Type;
