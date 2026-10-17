import { DateTime, Effect, Layer, Option } from "effect";
import { pageOf } from "../../paging/page.ts";
import type { InboundEmail } from "../aggregates/inbound-email.ts";
import { InboundEmailRepository } from "../services/inbound-email-repository.ts";

/** An {@link InboundEmailRepository} in a map, for tests and local development. */
export function inMemoryInboundEmailRepository() {
	const emails = new Map<string, InboundEmail>();

	const service: typeof InboundEmailRepository.Service = {
		save: (email) =>
			Effect.sync(() => {
				emails.set(email.id, email);
				return email;
			}),
		get: (id) => Effect.sync(() => Option.fromNullishOr(emails.get(id))),
		search: (filter, page) =>
			Effect.sync(() =>
				pageOf(
					[...emails.values()]
						.filter(
							(email) =>
								(filter.outcome === undefined ||
									email.outcome === filter.outcome) &&
								(filter.from === undefined ||
									email.from.toLowerCase().includes(filter.from.toLowerCase())),
						)
						.sort(
							(first, second) =>
								DateTime.toEpochMillis(second.receivedAt) -
								DateTime.toEpochMillis(first.receivedAt),
						),
					page,
				),
			),
		findByProviderMessageId: (providerMessageId) =>
			Effect.sync(() =>
				Option.fromNullishOr(
					[...emails.values()].find(
						(email) => email.providerMessageId === providerMessageId,
					),
				),
			),
	};

	return {
		emails,
		service,
		layer: Layer.succeed(InboundEmailRepository, service),
	};
}
