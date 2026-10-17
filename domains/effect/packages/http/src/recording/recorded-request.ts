import { Schema } from "effect";
import { RequestOutcome } from "./request-outcome.ts";

/**
 * One request sent to a partner, as it came back. Written once, never
 * changed. The path carries no query string: that is where partners take
 * emails, tokens and search terms.
 */
export const RecordedRequest = Schema.Struct({
	id: Schema.String,
	partner: Schema.String,
	method: Schema.String,
	host: Schema.String,
	path: Schema.String,
	/** `null` when no response came back. */
	status: Schema.NullOr(Schema.Int),
	outcome: RequestOutcome,
	durationMilliseconds: Schema.Int,
	/** The network error, or the start of the body of a response that was not a success. */
	failure: Schema.NullOr(Schema.String),
	/** The partner's own id for the request, to quote to its support. */
	providerRequestId: Schema.NullOr(Schema.String),
	startedAt: Schema.DateTimeUtc,
});

export type RecordedRequest = typeof RecordedRequest.Type;
