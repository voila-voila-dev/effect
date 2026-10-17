/**
 * Whether a received message came from a machine rather than a person, and so
 * must never be routed. Routing a reply posts a message, which notifies
 * people, which sends mail: an out-of-office or a bounce daemon answering that
 * notification is a loop that burns the sending domain in hours. When in
 * doubt, refuse.
 *
 * Two halves on different evidence, and routing refuses on either: a vacation
 * responder announces itself in its headers from a human-looking address,
 * while a bounce daemon may set no header at all.
 */

/** Local parts that only ever belong to an unattended mailbox. */
const AUTOMATED_LOCAL_PARTS: ReadonlyArray<string> = [
	"mailer-daemon",
	"postmaster",
	"no-reply",
	"noreply",
	"donotreply",
	"do-not-reply",
	"bounce",
	"bounces",
];

/** `Precedence` is not standard, but it is what lists and older responders set. */
const AUTOMATED_PRECEDENCE: ReadonlyArray<string> = [
	"bulk",
	"list",
	"junk",
	"auto_reply",
];

type HeaderValue = (name: string) => string;

/**
 * The announcements of an automaton: `Auto-Submitted` other than `no`
 * (RFC 3834), a bulk `Precedence`, Microsoft's `X-Auto-Response-Suppress`,
 * and list traffic (`List-Id`, `List-Unsubscribe`), which is never a reply.
 */
const AUTOMATED_HEADER_SIGNALS: ReadonlyArray<(value: HeaderValue) => boolean> =
	[
		(value) => !["", "no"].includes(value("auto-submitted")),
		(value) => AUTOMATED_PRECEDENCE.includes(value("precedence")),
		(value) => value("x-auto-response-suppress") !== "",
		(value) => value("list-id") !== "",
		(value) => value("list-unsubscribe") !== "",
	];

/** Whether the headers (names lowercased) announce an automaton. */
export function headersLookAutomated(
	headers: Readonly<Record<string, string>>,
): boolean {
	const value: HeaderValue = (name) =>
		(headers[name] ?? "").trim().toLowerCase();
	return AUTOMATED_HEADER_SIGNALS.some((signal) => signal(value));
}

/**
 * Whether the sender address is a machine's: a daemon or no-reply mailbox
 * (before any `+tag`), something with no `@`, or one of `ownDomains`, which is
 * the application answering its own mail.
 */
export function senderLooksAutomated(
	from: string,
	ownDomains: ReadonlyArray<string>,
): boolean {
	const address = from.trim().toLowerCase();
	const atIndex = address.lastIndexOf("@");
	if (atIndex < 0) return true;
	const domain = address.slice(atIndex + 1);
	const baseLocalPart = address.slice(0, atIndex).split("+")[0] ?? "";
	return (
		ownDomains.some((own) => domain === own || domain.endsWith(`.${own}`)) ||
		AUTOMATED_LOCAL_PARTS.includes(baseLocalPart)
	);
}
