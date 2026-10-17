/**
 * The one spelling of an address that lists compare on: trimmed and
 * lowercased. Mailbox providers fold case in practice, so `Marie@Example.fr`
 * and `marie@example.fr` must hit the same suppression entry.
 */
export function normalizeEmailAddress(address: string): string {
	return address.trim().toLowerCase();
}
