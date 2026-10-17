import { Context, type Effect, type Option } from "effect";
import type { EmailSendingStream } from "../../message/value-objects/email-sending-stream.ts";
import type { Page, PageRequest } from "../../paging/page.ts";
import type { EmailLog } from "../aggregates/email-log.ts";
import type { EmailDeliveryState } from "../payloads/email-delivery-state.ts";
import type { EmailLogSummary } from "../payloads/email-log-summary.ts";
import type { EmailLogId } from "../value-objects/email-log-id.ts";
import type { EmailLogStatus } from "../value-objects/email-log-status.ts";

export interface EmailLogFilter {
	/** A part of one recipient's address. */
	readonly recipient?: string;
	readonly status?: EmailLogStatus;
	readonly stream?: EmailSendingStream;
}

/**
 * Where logged sends are kept, outbox included. The domain names the
 * contract; an adapter (in memory here, a database in an application)
 * implements it.
 */
export class EmailLogRepository extends Context.Service<
	EmailLogRepository,
	{
		/**
		 * Upsert by id. Also releases the drain's claim on the log, so writing
		 * an outcome and handing the row back are one write, and a retry is
		 * claimable again the moment it is due.
		 */
		readonly save: (log: EmailLog) => Effect.Effect<EmailLog>;
		/**
		 * The drain's claim: leases up to `limit` pending logs whose attempt is
		 * due and that nobody holds, most urgent stream first, then oldest due
		 * first (see `EMAIL_STREAM_DRAIN_PRIORITY`). Two drains take disjoint
		 * logs; a lease outliving its holder expires after `EMAIL_CLAIM_LEASE`.
		 */
		readonly claimDuePending: (
			limit: number,
		) => Effect.Effect<ReadonlyArray<EmailLog>>;
		/**
		 * The enqueuer's inline first attempt claims the one log it just wrote,
		 * so the sweep cannot race it into a double send. None when it is not
		 * pending or someone holds it: whoever does delivers it.
		 */
		readonly claimPendingById: (
			id: EmailLogId,
		) => Effect.Effect<Option.Option<EmailLog>>;
		readonly get: (id: EmailLogId) => Effect.Effect<Option.Option<EmailLog>>;
		/** Newest first, without the bodies. */
		readonly search: (
			filter: EmailLogFilter,
			page: PageRequest,
		) => Effect.Effect<Page<EmailLogSummary>>;
		/** How a replayed send finds the attempt it already made. */
		readonly findByDedupeKey: (
			dedupeKey: string,
		) => Effect.Effect<Option.Option<EmailLog>>;
		/** How a provider event finds its send, without loading the message. */
		readonly findDeliveryStateByProviderMessageId: (
			providerMessageId: string,
		) => Effect.Effect<Option.Option<EmailDeliveryState>>;
		readonly saveDeliveryState: (
			state: EmailDeliveryState,
		) => Effect.Effect<void>;
		/**
		 * How a reply finds the send it answers, by the RFC `Message-ID` it quotes
		 * in `In-Reply-To`: the header a mail client echoes, which only the
		 * delivery webhook ties to the send.
		 */
		readonly findByRfcMessageId: (
			rfcMessageId: string,
		) => Effect.Effect<Option.Option<EmailLog>>;
		/**
		 * Soft bounces to this address since its last delivery: the run that
		 * tells a busy mailbox from an abandoned one. Read rather than kept as
		 * a counter, which every delivery on every path would have to reset.
		 */
		readonly countSoftBouncesSinceLastDelivery: (
			recipient: string,
		) => Effect.Effect<number>;
	}
>()("@voila.dev/email/EmailLogRepository") {}
