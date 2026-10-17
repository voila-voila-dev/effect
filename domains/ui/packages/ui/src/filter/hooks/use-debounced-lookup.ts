import { useEffect, useState } from "react";

/** A keystroke is not a query: lookups wait this long after the last one. */
export const LOOKUP_DEBOUNCE_MS = 300;

/** Below this many characters a lookup would match everything and help no one. */
export const LOOKUP_MIN_QUERY_LENGTH = 2;

/**
 * Debounced search-as-you-type against a lookup the screen supplies (a
 * geocoder, a record search). A failed lookup reads as "no results" — the
 * field stays usable — and a stale answer never overwrites a newer query's.
 */
export function useDebouncedLookup<Result>(
	query: string,
	lookup: (query: string) => Promise<ReadonlyArray<Result>>,
): { results: ReadonlyArray<Result>; busy: boolean } {
	const [results, setResults] = useState<ReadonlyArray<Result>>([]);
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		const trimmed = query.trim();
		if (trimmed.length < LOOKUP_MIN_QUERY_LENGTH) {
			setResults([]);
			setBusy(false);
			return;
		}
		setBusy(true);
		let cancelled = false;
		const handle = setTimeout(() => {
			lookup(trimmed)
				.then((found) => {
					if (!cancelled) {
						setResults(found);
					}
				})
				.catch(() => {
					if (!cancelled) {
						setResults([]);
					}
				})
				.finally(() => {
					if (!cancelled) {
						setBusy(false);
					}
				});
		}, LOOKUP_DEBOUNCE_MS);
		return () => {
			cancelled = true;
			clearTimeout(handle);
		};
	}, [query, lookup]);

	return { results, busy };
}
