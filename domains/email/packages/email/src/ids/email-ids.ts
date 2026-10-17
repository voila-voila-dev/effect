import { uuidV7 } from "@voila.dev/outbox";
import { Clock, Context, Effect } from "effect";

export interface EmailIdsShape {
	readonly next: Effect.Effect<string>;
}

/**
 * Where the email domain's ids come from (a logged send, a suppression). A
 * reference with a UUIDv7 default, so nothing has to provide it; a test pins
 * them with `Effect.provideService(EmailIds, …)`.
 */
export const EmailIds = Context.Reference<EmailIdsShape>(
	"@voila.dev/email/EmailIds",
	{
		defaultValue: () => ({ next: Effect.map(Clock.currentTimeMillis, uuidV7) }),
	},
);
