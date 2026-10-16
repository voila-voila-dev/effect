import { isIP } from "node:net";
import { type HostResolver, systemHostResolver } from "./host-resolver.ts";
import { isPrivateAddress } from "./private-address.ts";

const SUPPORTED_PROTOCOLS: ReadonlySet<string> = new Set(["http:", "https:"]);
const DEFAULT_WEB_PORTS: ReadonlySet<string> = new Set(["", "80", "443"]);

/** http(s) on a default web port, with no embedded credentials. */
function parsePlainHttpUrl(rawUrl: string): URL | null {
	try {
		const url = new URL(rawUrl);
		return SUPPORTED_PROTOCOLS.has(url.protocol) &&
			DEFAULT_WEB_PORTS.has(url.port) &&
			url.username === "" &&
			url.password === ""
			? url
			: null;
	} catch {
		return null;
	}
}

async function isPublicHostname(
	hostname: string,
	resolve: HostResolver,
): Promise<boolean> {
	if (isIP(hostname) !== 0) return !isPrivateAddress(hostname);
	try {
		const addresses = await resolve(hostname);
		return (
			addresses.length > 0 &&
			addresses.every((address) => !isPrivateAddress(address))
		);
	} catch {
		return false;
	}
}

/**
 * The parsed URL when it is http(s) on a default web port and its host
 * resolves only to public addresses; `null` otherwise. One private address
 * among several is enough to refuse: the fetch may pick any of them.
 */
export async function resolvePublicHttpUrl(
	rawUrl: string,
	resolve: HostResolver = systemHostResolver,
): Promise<URL | null> {
	const url = parsePlainHttpUrl(rawUrl);
	if (url === null) return null;
	const hostname = url.hostname.replace(/^\[|\]$/gu, "");
	return (await isPublicHostname(hostname, resolve)) ? url : null;
}
