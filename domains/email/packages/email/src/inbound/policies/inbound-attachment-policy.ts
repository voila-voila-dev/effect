/**
 * What may be kept off a received message. Every received byte is hostile: a
 * catch-all collects spam and a reply can carry anything. So bytes are kept
 * only when they clear an exact, parameter-stripped type allowlist (a crafted
 * `application/pdf; boundary=…` does not slip through a prefix match) and a
 * size cap; the rest stays as metadata on the message.
 */

/** 15 MB: above a scanned multi-page PDF, below anything that belongs in email. */
export const MAX_INBOUND_ATTACHMENT_BYTES = 15 * 1024 * 1024;

/** What a reply legitimately carries: a scan or photo of a document, a PDF, a Word file. */
export const STORABLE_INBOUND_CONTENT_TYPES: ReadonlySet<string> = new Set([
	"application/pdf",
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
	"image/heic",
	"image/heif",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function bareContentType(contentType: string): string {
	return (contentType.split(";")[0] ?? "").trim().toLowerCase();
}

/** Whether a fetched attachment may be kept: an allowed type, not empty, within the cap. */
export function isStorableInboundAttachment(input: {
	readonly contentType: string;
	readonly sizeBytes: number;
}): boolean {
	return (
		input.sizeBytes > 0 &&
		input.sizeBytes <= MAX_INBOUND_ATTACHMENT_BYTES &&
		STORABLE_INBOUND_CONTENT_TYPES.has(bareContentType(input.contentType))
	);
}
