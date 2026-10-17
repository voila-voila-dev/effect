const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });

/**
 * UTF-8 bytes of `value`, typed over a plain `ArrayBuffer`: that is what Web
 * Crypto's `BufferSource` accepts, where `TextEncoder` alone returns the wider
 * `ArrayBufferLike`.
 */
export function utf8Bytes(value: string): Uint8Array<ArrayBuffer> {
	return new Uint8Array(encoder.encode(value));
}

/** The text of UTF-8 `bytes`; throws on an invalid sequence rather than inventing U+FFFD. */
export function textFromUtf8(bytes: Uint8Array): string {
	return decoder.decode(bytes);
}
