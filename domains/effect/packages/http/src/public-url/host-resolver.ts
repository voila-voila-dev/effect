import { lookup } from "node:dns/promises";

/** Every address a hostname resolves to; a test passes a table instead of asking DNS. */
export type HostResolver = (hostname: string) => Promise<ReadonlyArray<string>>;

export const systemHostResolver: HostResolver = async (hostname) => {
	const entries = await lookup(hostname, { all: true, verbatim: true });
	return entries.map((entry) => entry.address);
};
