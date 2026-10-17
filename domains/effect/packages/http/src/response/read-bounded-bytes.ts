function concatenate(
	chunks: ReadonlyArray<Uint8Array>,
	totalBytes: number,
): Uint8Array {
	const merged = new Uint8Array(totalBytes);
	let offset = 0;
	for (const chunk of chunks) {
		merged.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return merged;
}

/**
 * A response body read into memory, or `null` once it passes `maxBytes`: the
 * stream is cancelled there, so an oversized or endless answer is refused
 * without being buffered whole. An absent body reads as empty.
 */
export async function readBoundedBytes(
	response: Response,
	maxBytes: number,
): Promise<Uint8Array | null> {
	if (response.body === null) return new Uint8Array();
	const reader = response.body.getReader();
	const chunks: Array<Uint8Array> = [];
	let totalBytes = 0;
	while (true) {
		const { done, value } = await reader.read();
		if (done) return concatenate(chunks, totalBytes);
		totalBytes += value.byteLength;
		if (totalBytes > maxBytes) {
			await reader.cancel().catch(() => undefined);
			return null;
		}
		chunks.push(value);
	}
}
