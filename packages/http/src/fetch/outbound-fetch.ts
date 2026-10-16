import { Context, Effect } from "effect";
import { type Fetch, globalFetch } from "./fetch.ts";

/**
 * The `fetch` each partner's calls go through, chosen per partner. Left
 * unprovided (tests, scripts) it is the global one; an application provides a
 * recording one (`recordingFetchLayer`) so every request lands in its log.
 */
export const OutboundFetch = Context.Reference<(partner: string) => Fetch>(
	"@voila.dev/http/OutboundFetch",
	{ defaultValue: () => () => globalFetch },
);

/** The `fetch` for `partner`, read from the calling fiber. */
export function outboundFetch(partner: string): Effect.Effect<Fetch> {
	return Effect.map(OutboundFetch, (fetchFor) => fetchFor(partner));
}
