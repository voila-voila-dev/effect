import {
	decodeJsonResponse,
	ensureSuccess,
	OutboundTimeout,
	outboundCall,
	ResponseTooLargeError,
	readBoundedBytes,
	sendOutbound,
	withTimeout,
} from "@voila.dev/http";
import { Config, Effect, Layer, Redacted } from "effect";
import { describeOutboundFailure } from "../describe-outbound-failure.ts";
import {
	ReceivedAttachmentAnswer,
	ReceivedEmailAnswer,
	readReceivedEmail,
} from "./read-received-email.ts";
import { ResendReceivingError } from "./received-email.ts";
import { ResendReceiving } from "./resend-receiving.ts";

const API_BASE_URL = "https://api.resend.com";

/** Resend accepts attachments up to 40 MB in total. */
const DEFAULT_MAX_ATTACHMENT_BYTES = 40 * 1024 * 1024;

export interface ResendReceivingOptions {
	readonly apiKey: Redacted.Redacted<string>;
	/** The partner the requests go out as; `resend` unless told otherwise. */
	readonly partner?: string;
	/** The largest attachment read into memory; 40 MiB by default. */
	readonly maxAttachmentBytes?: number;
}

function failed(what: string) {
	return (error: unknown) =>
		new ResendReceivingError({
			message: `Resend ${what} failed: ${describeOutboundFailure(error)}`,
		});
}

/**
 * {@link ResendReceiving} over Resend's API. An attachment is fetched in two
 * steps: its metadata, under the API key, for a short-lived signed URL; then
 * the bytes from that URL, which needs no key.
 */
export function makeResendReceiving(
	options: ResendReceivingOptions,
): typeof ResendReceiving.Service {
	const partner = options.partner ?? "resend";
	const maxAttachmentBytes =
		options.maxAttachmentBytes ?? DEFAULT_MAX_ATTACHMENT_BYTES;
	const authorized = {
		headers: { authorization: `Bearer ${Redacted.value(options.apiKey)}` },
	};

	return {
		getEmail: (emailId) =>
			sendOutbound(
				partner,
				`${API_BASE_URL}/emails/receiving/${encodeURIComponent(emailId)}`,
				authorized,
			).pipe(
				Effect.flatMap(ensureSuccess),
				Effect.flatMap(decodeJsonResponse(ReceivedEmailAnswer)),
				withTimeout(OutboundTimeout.roundTrip),
				Effect.map(readReceivedEmail),
				Effect.mapError(failed("receiving fetch")),
				outboundCall({ partner, operation: "receiving.get" }),
			),

		getAttachment: (emailId, attachmentId) =>
			Effect.gen(function* () {
				const meta = yield* sendOutbound(
					partner,
					`${API_BASE_URL}/emails/receiving/${encodeURIComponent(emailId)}/attachments/${encodeURIComponent(attachmentId)}`,
					authorized,
				).pipe(
					Effect.flatMap(ensureSuccess),
					Effect.flatMap(decodeJsonResponse(ReceivedAttachmentAnswer)),
					withTimeout(OutboundTimeout.roundTrip),
				);
				const downloadUrl = meta.download_url ?? meta.url;
				if (!downloadUrl) {
					return yield* new ResendReceivingError({
						message: "Resend attachment has no download_url",
					});
				}
				const file = yield* sendOutbound(partner, downloadUrl).pipe(
					Effect.flatMap(ensureSuccess),
					withTimeout(OutboundTimeout.long),
				);
				const bytes = yield* Effect.tryPromise({
					try: () => readBoundedBytes(file, maxAttachmentBytes),
					catch: (cause) => cause,
				});
				if (bytes === null) {
					return yield* new ResponseTooLargeError({
						maxBytes: maxAttachmentBytes,
					});
				}
				return {
					bytes,
					contentType: meta.content_type ?? "application/octet-stream",
				};
			}).pipe(
				Effect.mapError((error) =>
					error instanceof ResendReceivingError
						? error
						: failed("attachment fetch")(error),
				),
				outboundCall({ partner, operation: "receiving.attachment" }),
			),
	};
}

/** {@link makeResendReceiving} as the {@link ResendReceiving} layer. */
export function resendReceivingLayer(
	options: ResendReceivingOptions,
): Layer.Layer<ResendReceiving> {
	return Layer.succeed(ResendReceiving, makeResendReceiving(options));
}

/** {@link resendReceivingLayer} with the key read from `RESEND_API_KEY`. */
export const resendReceivingFromConfig: Layer.Layer<
	ResendReceiving,
	Config.ConfigError
> = Layer.unwrap(
	Effect.map(Config.Redacted("RESEND_API_KEY"), (apiKey) =>
		resendReceivingLayer({ apiKey }),
	),
);
