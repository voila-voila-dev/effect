import { readBoundedBytes } from "../response/read-bounded-bytes.ts";
import {
	type FetchPublicUrlOptions,
	fetchPublicUrl,
} from "./fetch-public-url.ts";

export interface FetchedPublicImage {
	readonly bytes: Uint8Array;
	readonly mimeType: string;
}

// Anything not declared as an image is kept as opaque bytes: trusting a
// mislabeled type would let a fetched page or script be served back later
// under an image name.
function imageMimeType(response: Response): string {
	const declared = (response.headers.get("content-type") ?? "")
		.split(";")[0]
		?.trim();
	return declared?.startsWith("image/") ? declared : "application/octet-stream";
}

/**
 * {@link fetchPublicUrl} for an image, reading at most `maxBytes`. `null` when
 * the URL is refused, the answer is not a success, or the body is empty or
 * over the bound: the caller answers "could not fetch" either way.
 */
export async function fetchPublicImage(
	url: string | URL,
	options: FetchPublicUrlOptions & { readonly maxBytes: number },
): Promise<FetchedPublicImage | null> {
	const response = await fetchPublicUrl(url.toString(), options);
	if (response === null || !response.ok) return null;
	const bytes = await readBoundedBytes(response, options.maxBytes).catch(
		() => null,
	);
	if (bytes === null || bytes.byteLength === 0) return null;
	return { bytes, mimeType: imageMimeType(response) };
}
