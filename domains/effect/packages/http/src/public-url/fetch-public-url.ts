import { type Fetch, globalFetch } from "../fetch/fetch.ts";
import type { HostResolver } from "./host-resolver.ts";
import { resolvePublicHttpUrl } from "./public-http-url.ts";

const MAX_REDIRECTS = 3;

export interface FetchPublicUrlOptions {
	readonly timeoutMilliseconds: number;
	readonly headers?: Readonly<Record<string, string>>;
	readonly fetch?: Fetch;
	readonly resolveHost?: HostResolver;
}

type Hop =
	| { readonly outcome: "response"; readonly response: Response }
	| { readonly outcome: "redirect"; readonly nextUrl: string }
	| { readonly outcome: "blocked" };

function redirectLocation(response: Response, base: URL): string | null {
	if (response.status < 300 || response.status >= 400) return null;
	const location = response.headers.get("location");
	return location === null ? null : new URL(location, base).toString();
}

async function fetchHop(
	rawUrl: string,
	options: FetchPublicUrlOptions,
): Promise<Hop> {
	const url = await resolvePublicHttpUrl(rawUrl, options.resolveHost);
	if (url === null) return { outcome: "blocked" };
	let response: Response;
	try {
		response = await (options.fetch ?? globalFetch)(url.toString(), {
			...(options.headers === undefined ? {} : { headers: options.headers }),
			signal: AbortSignal.timeout(options.timeoutMilliseconds),
			// A redirect comes back to the guard: followed blindly it is an open door to the internal network.
			redirect: "manual",
		});
	} catch {
		return { outcome: "blocked" };
	}
	const nextUrl = redirectLocation(response, url);
	return nextUrl === null
		? { outcome: "response", response }
		: { outcome: "redirect", nextUrl };
}

/**
 * Fetches a URL a user supplied, refusing it (`null`) when it or any redirect
 * hop is not a public http(s) address, after three redirects, or on any fetch
 * failure. Without this a server fetching "your logo URL" can be pointed at
 * loopback, cloud metadata or the container network.
 *
 * The address is checked by a lookup separate from the fetch's own, so a fast
 * DNS rebind can in theory race it: keep internal endpoints authenticated too.
 */
export async function fetchPublicUrl(
	rawUrl: string,
	options: FetchPublicUrlOptions,
): Promise<Response | null> {
	let current = rawUrl;
	for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
		const result = await fetchHop(current, options);
		if (result.outcome === "blocked") return null;
		if (result.outcome === "response") return result.response;
		current = result.nextUrl;
	}
	return null;
}
