import { Effect, Layer } from "effect";
import { InboundEmailFetchError } from "../errors/inbound-email-fetch-error.ts";
import {
	type FetchedInboundAttachment,
	type FetchedInboundContent,
	InboundEmailFetcher,
} from "../services/inbound-email-fetcher.ts";

/**
 * An {@link InboundEmailFetcher} that answers what a test put in `contents`
 * and `attachments` (keyed `<message id>/<attachment id>`), and fails like an
 * unreachable provider for anything else.
 */
export function inMemoryInboundEmailFetcher() {
	const contents = new Map<string, FetchedInboundContent>();
	const attachments = new Map<string, FetchedInboundAttachment>();

	function found<A>(value: A | undefined, what: string) {
		return value === undefined
			? Effect.fail(
					new InboundEmailFetchError({ message: `${what}: not found` }),
				)
			: Effect.succeed(value);
	}

	const service: typeof InboundEmailFetcher.Service = {
		fetchContent: (providerMessageId) =>
			Effect.suspend(() =>
				found(contents.get(providerMessageId), providerMessageId),
			),
		fetchAttachment: (providerMessageId, attachmentId) =>
			Effect.suspend(() => {
				const key = `${providerMessageId}/${attachmentId}`;
				return found(attachments.get(key), key);
			}),
	};

	return {
		contents,
		attachments,
		service,
		layer: Layer.succeed(InboundEmailFetcher, service),
	};
}
