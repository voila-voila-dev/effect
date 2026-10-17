import { Clock, DateTime, Duration, Effect, Layer, Option } from "effect";
import { normalizeEmailAddress } from "../../message/lib/normalize-email-address.ts";
import { pageOf } from "../../paging/page.ts";
import { EmailLog } from "../aggregates/email-log.ts";
import { EmailDeliveryState } from "../payloads/email-delivery-state.ts";
import type { EmailLogSummary } from "../payloads/email-log-summary.ts";
import {
	EMAIL_CLAIM_LEASE,
	EMAIL_STREAM_DRAIN_PRIORITY,
} from "../policies/email-outbox-policy.ts";
import {
	type EmailLogFilter,
	EmailLogRepository,
} from "../services/email-log-repository.ts";

function millis(at: DateTime.Utc | null, fallback: DateTime.Utc): number {
	return DateTime.toEpochMillis(at ?? fallback);
}

function byDrainOrder(first: EmailLog, second: EmailLog): number {
	return (
		EMAIL_STREAM_DRAIN_PRIORITY[first.stream] -
			EMAIL_STREAM_DRAIN_PRIORITY[second.stream] ||
		millis(first.nextAttemptAt, first.createdAt) -
			millis(second.nextAttemptAt, second.createdAt)
	);
}

function matches(log: EmailLog, filter: EmailLogFilter): boolean {
	const recipient = filter.recipient?.toLowerCase();
	return (
		(filter.status === undefined || log.status === filter.status) &&
		(filter.stream === undefined || log.stream === filter.stream) &&
		(recipient === undefined ||
			log.recipients.some((address) =>
				address.toLowerCase().includes(recipient),
			))
	);
}

function deliveryStateOf(log: EmailLog): EmailDeliveryState {
	return new EmailDeliveryState({
		id: log.id,
		status: log.status,
		deliveredAt: log.deliveredAt,
		bouncedAt: log.bouncedAt,
		bounceKind: log.bounceKind,
		complainedAt: log.complainedAt,
		failureReason: log.failureReason,
		rfcMessageId: log.rfcMessageId,
		lastProviderEventAt: log.lastProviderEventAt,
	});
}

function summary(log: EmailLog): EmailLogSummary {
	return {
		id: log.id,
		to: log.message.to,
		subject: log.message.subject,
		stream: log.stream,
		status: log.status,
		failureReason: log.failureReason,
		resendOfId: log.resendOfId,
		openedAt: log.openedAt,
		createdAt: log.createdAt,
	};
}

/**
 * An {@link EmailLogRepository} in a map, leases included, for tests and
 * local development. Time is read from the `Clock`, so a `TestClock` drives
 * the retry curve and the lease expiry.
 */
export function inMemoryEmailLogRepository() {
	const logs = new Map<string, EmailLog>();
	const leasedUntil = new Map<string, number>();

	const claimable = (log: EmailLog, now: number) =>
		log.isPending &&
		millis(log.nextAttemptAt, log.createdAt) <= now &&
		(leasedUntil.get(log.id) ?? 0) <= now;

	const lease = (log: EmailLog, now: number) => {
		leasedUntil.set(log.id, now + Duration.toMillis(EMAIL_CLAIM_LEASE));
		return log;
	};

	const service: typeof EmailLogRepository.Service = {
		save: (log) =>
			Effect.sync(() => {
				logs.set(log.id, log);
				leasedUntil.delete(log.id);
				return log;
			}),
		claimDuePending: (limit) =>
			Effect.map(Clock.currentTimeMillis, (now) =>
				[...logs.values()]
					.filter((log) => claimable(log, now))
					.sort(byDrainOrder)
					.slice(0, limit)
					.map((log) => lease(log, now)),
			),
		claimPendingById: (id) =>
			Effect.map(Clock.currentTimeMillis, (now) => {
				const log = logs.get(id);
				return log !== undefined && claimable(log, now)
					? Option.some(lease(log, now))
					: Option.none();
			}),
		get: (id) => Effect.sync(() => Option.fromNullishOr(logs.get(id))),
		search: (filter, page) =>
			Effect.sync(() =>
				pageOf(
					[...logs.values()]
						.filter((log) => matches(log, filter))
						.sort(
							(first, second) =>
								DateTime.toEpochMillis(second.createdAt) -
								DateTime.toEpochMillis(first.createdAt),
						)
						.map(summary),
					page,
				),
			),
		findByDedupeKey: (dedupeKey) =>
			Effect.sync(() =>
				Option.fromNullishOr(
					[...logs.values()].find((log) => log.dedupeKey === dedupeKey),
				),
			),
		findDeliveryStateByProviderMessageId: (providerMessageId) =>
			Effect.sync(() => {
				const log = [...logs.values()].find(
					(candidate) => candidate.providerMessageId === providerMessageId,
				);
				return log === undefined
					? Option.none()
					: Option.some(deliveryStateOf(log));
			}),
		saveDeliveryState: (state) =>
			Effect.sync(() => {
				const log = logs.get(state.id);
				if (log !== undefined) {
					logs.set(log.id, new EmailLog({ ...log, ...state }));
				}
			}),
		findByRfcMessageId: (rfcMessageId) =>
			Effect.sync(() =>
				Option.fromNullishOr(
					[...logs.values()].find((log) => log.rfcMessageId === rfcMessageId),
				),
			),
		countSoftBouncesSinceLastDelivery: (recipient) =>
			Effect.sync(() => {
				const address = normalizeEmailAddress(recipient);
				const toAddress = [...logs.values()]
					.filter((log) =>
						log.recipients.some(
							(candidate) => normalizeEmailAddress(candidate) === address,
						),
					)
					.sort(
						(first, second) =>
							DateTime.toEpochMillis(second.createdAt) -
							DateTime.toEpochMillis(first.createdAt),
					);
				const sinceDelivery = toAddress.findIndex(
					(log) => log.deliveredAt !== null,
				);
				return (
					sinceDelivery === -1 ? toAddress : toAddress.slice(0, sinceDelivery)
				).filter((log) => log.bounceKind === "Soft").length;
			}),
	};

	return { logs, service, layer: Layer.succeed(EmailLogRepository, service) };
}
