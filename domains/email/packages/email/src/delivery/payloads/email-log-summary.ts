import type { DateTime } from "effect";
import type { EmailSendingStream } from "../../message/value-objects/email-sending-stream.ts";
import type { EmailLogId } from "../value-objects/email-log-id.ts";
import type { EmailLogStatus } from "../value-objects/email-log-status.ts";

/**
 * A logged send as a list shows it: without the bodies and attachments, which
 * would multiply a page's weight a thousandfold. The detail read loads them.
 */
export interface EmailLogSummary {
	readonly id: EmailLogId;
	readonly to: ReadonlyArray<string>;
	readonly subject: string;
	readonly stream: EmailSendingStream;
	readonly status: EmailLogStatus;
	readonly failureReason: string | null;
	readonly resendOfId: EmailLogId | null;
	readonly openedAt: DateTime.Utc | null;
	readonly createdAt: DateTime.Utc;
}
