/**
 * The message ids a reply points at, most specific first: `In-Reply-To` names
 * the message answered, and the last entry of `References` is the nearest
 * thing to it when a client set no `In-Reply-To`.
 */
export function threadedMessageIds(
	headers: Readonly<Record<string, string>>,
): ReadonlyArray<string> {
	const inReplyTo = (headers["in-reply-to"] ?? "").trim();
	const references = (headers.references ?? "")
		.trim()
		.split(/\s+/u)
		.filter(Boolean);
	return [inReplyTo, references.at(-1) ?? ""].filter(Boolean);
}

/** Everything before the last `@`, or null when there is none. */
export function localPartOf(address: string): string | null {
	const atIndex = address.lastIndexOf("@");
	return atIndex < 0 ? null : address.slice(0, atIndex);
}
