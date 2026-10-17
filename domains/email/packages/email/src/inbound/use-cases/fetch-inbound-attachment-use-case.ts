import { UseCase } from "@voila.dev/effect-ddd";
import { Effect, Option, Schema } from "effect";
import { EmailActor } from "../../access/email-actor.ts";
import { system } from "../../access/email-gates.ts";
import { isStorableInboundAttachment } from "../policies/inbound-attachment-policy.ts";
import { InboundEmailFetcher } from "../services/inbound-email-fetcher.ts";

const Input = Schema.Struct({
	actor: EmailActor,
	payload: Schema.Struct({
		providerMessageId: Schema.String,
		attachmentId: Schema.String,
	}),
});

/**
 * The bytes of one received file, for a handler keeping a reply's documents.
 * None when the file fails the attachment policy (type or size): the caller
 * keeps only what it is handed.
 */
export const FetchInboundAttachmentUseCase = UseCase.make({
	name: "inbound.fetch-inbound-attachment",
	input: Input,
	gate: system<typeof Input.Type>(),
	execute: ({ payload }) =>
		Effect.flatMap(InboundEmailFetcher, (fetcher) =>
			fetcher.fetchAttachment(payload.providerMessageId, payload.attachmentId),
		).pipe(
			Effect.map((attachment) =>
				isStorableInboundAttachment({
					contentType: attachment.contentType,
					sizeBytes: attachment.bytes.byteLength,
				})
					? Option.some(attachment)
					: Option.none(),
			),
		),
});
