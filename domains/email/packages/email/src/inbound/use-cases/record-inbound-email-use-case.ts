import { UseCase } from "@voila.dev/effect-ddd";
import { DateTime, Effect, Option, Schema } from "effect";
import { EmailActor } from "../../access/email-actor.ts";
import { system } from "../../access/email-gates.ts";
import { EmailIds } from "../../ids/email-ids.ts";
import { EmailAddress } from "../../message/value-objects/email-address.ts";
import { InboundEmail } from "../aggregates/inbound-email.ts";
import { InboundEmailFetcher } from "../services/inbound-email-fetcher.ts";
import { InboundEmailRepository } from "../services/inbound-email-repository.ts";
import { InboundEmailAttachment } from "../value-objects/inbound-email-attachment.ts";
import { InboundEmailId } from "../value-objects/inbound-email-id.ts";

const Input = Schema.Struct({
	actor: EmailActor,
	payload: Schema.Struct({
		providerMessageId: Schema.String,
		from: EmailAddress,
		to: Schema.String,
		subject: Schema.String,
		attachments: Schema.Array(InboundEmailAttachment),
		receivedAt: Schema.DateTimeUtc,
	}),
});

/**
 * Stores one received message: what the "received" webhook carried, plus the
 * body, headers and verdicts fetched from the provider. A message already
 * stored is answered as it is, without fetching again: a redelivered webhook
 * neither duplicates it nor spends the provider's quota.
 */
export const RecordInboundEmailUseCase = UseCase.make({
	name: "inbound.record-inbound-email",
	input: Input,
	gate: system<typeof Input.Type>(),
	execute: ({ payload }) =>
		Effect.gen(function* () {
			const repository = yield* InboundEmailRepository;
			const existing = yield* repository.findByProviderMessageId(
				payload.providerMessageId,
			);
			if (Option.isSome(existing)) return existing.value;

			const fetcher = yield* InboundEmailFetcher;
			const content = yield* fetcher.fetchContent(payload.providerMessageId);
			const ids = yield* EmailIds;
			return yield* repository.save(
				InboundEmail.received({
					id: InboundEmailId.make(yield* ids.next),
					providerMessageId: payload.providerMessageId,
					from: payload.from,
					to: payload.to,
					subject: payload.subject,
					rawText: content.text,
					rawHtml: content.html,
					spf: content.spf,
					dkim: content.dkim,
					dmarc: content.dmarc,
					headers: content.headers,
					attachments: payload.attachments,
					receivedAt: payload.receivedAt,
					createdAt: yield* DateTime.now,
				}),
			);
		}),
});
