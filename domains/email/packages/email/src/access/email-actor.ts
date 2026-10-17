import { Schema } from "effect";
import { EmailPermission } from "./email-permission.ts";

/**
 * A person acting on the email domain from an application: a support agent
 * reading the log, an admin releasing an address. The application resolves
 * who they are and which {@link EmailPermission}s they hold before calling.
 */
export class EmailOperator extends Schema.TaggedClass<EmailOperator>()(
	"EmailOperator",
	{
		/** The application's own id for them, for the traces. */
		operatorId: Schema.String,
		permissions: Schema.Array(EmailPermission),
	},
) {}

/** The process itself: a scheduled sweep, a provider webhook, a feature sending mail. */
export class EmailSystem extends Schema.TaggedClass<EmailSystem>()(
	"EmailSystem",
	{},
) {}

/**
 * Who calls a use case of the email domain. The domain names its own callers
 * rather than importing an application's actor, so any application can map
 * its sessions onto these two.
 */
export const EmailActor = Schema.Union([EmailOperator, EmailSystem]);

export type EmailActor = typeof EmailActor.Type;
