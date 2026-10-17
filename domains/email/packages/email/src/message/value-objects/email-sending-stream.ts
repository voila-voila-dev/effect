import { Schema } from "effect";

/**
 * What kind of mail a send is. Providers score a sending domain by how its
 * recipients react, and campaigns earn spam complaints at a rate a sign-in
 * code never does: keeping the streams apart (each on its own sender domain,
 * the application's choice) stops a campaign from putting the login codes in
 * the spam folder. The outbox also drains them in this order.
 */
export const EMAIL_SENDING_STREAMS = [
	/** Someone is waiting on a screen for it: a sign-in code, a receipt. */
	"Transactional",
	/** Something happened and the mail says so; nobody is blocked on it. */
	"Notification",
	/** Campaigns, to a list. */
	"Marketing",
] as const;

export const EmailSendingStream = Schema.Literals(EMAIL_SENDING_STREAMS);

export type EmailSendingStream = typeof EmailSendingStream.Type;
