import { Schema } from "effect";
import { BounceKind } from "../value-objects/bounce-kind.ts";
import { EmailLogId } from "../value-objects/email-log-id.ts";
import { EmailLogStatus } from "../value-objects/email-log-status.ts";

/**
 * What a provider event reads and writes on a logged send, and nothing else.
 * A storm of events arrives in the same second as the batch that caused it;
 * loading every message whole, bodies and attachments, to stamp a timestamp
 * is how an API falls over.
 */
export class EmailDeliveryState extends Schema.Class<EmailDeliveryState>(
	"EmailDeliveryState",
)({
	id: EmailLogId,
	status: EmailLogStatus,
	deliveredAt: Schema.NullOr(Schema.DateTimeUtcFromString),
	bouncedAt: Schema.NullOr(Schema.DateTimeUtcFromString),
	bounceKind: Schema.NullOr(BounceKind),
	complainedAt: Schema.NullOr(Schema.DateTimeUtcFromString),
	failureReason: Schema.NullOr(Schema.String),
	rfcMessageId: Schema.NullOr(Schema.String),
	lastProviderEventAt: Schema.NullOr(Schema.DateTimeUtcFromString),
}) {}
