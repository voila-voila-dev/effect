import { DateTime, Effect, Layer, Option } from "effect";
import { pageOf } from "../../paging/page.ts";
import type { SuppressedAddress } from "../aggregates/suppressed-address.ts";
import { SuppressionList } from "../services/suppression-list.ts";

function newestFirst(first: SuppressedAddress, second: SuppressedAddress) {
	return (
		DateTime.toEpochMillis(second.firstSuppressedAt) -
		DateTime.toEpochMillis(first.firstSuppressedAt)
	);
}

/** A {@link SuppressionList} in a map, for tests and local development. */
export function inMemorySuppressionList() {
	const byEmail = new Map<string, SuppressedAddress>();

	const service: typeof SuppressionList.Service = {
		save: (address) =>
			Effect.sync(() => {
				byEmail.set(address.email, address);
				return address;
			}),
		findByEmail: (email) =>
			Effect.sync(() => Option.fromNullishOr(byEmail.get(email))),
		areSuppressed: (emails) =>
			Effect.sync(() => new Set(emails.filter((email) => byEmail.has(email)))),
		search: (filter, page) =>
			Effect.sync(() =>
				pageOf(
					[...byEmail.values()]
						.filter(
							(address) =>
								(filter.reason === undefined ||
									address.reason === filter.reason) &&
								(filter.query === undefined ||
									address.email.includes(filter.query.toLowerCase())),
						)
						.sort(newestFirst),
					page,
				),
			),
		delete: (email) =>
			Effect.sync(() => {
				byEmail.delete(email);
			}),
	};

	return {
		addresses: byEmail,
		service,
		layer: Layer.succeed(SuppressionList, service),
	};
}
