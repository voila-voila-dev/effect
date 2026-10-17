import { Effect, Redacted, Schema } from "effect";
import { hexFromBytes } from "../bytes/hex.ts";
import { utf8Bytes } from "../bytes/utf8.ts";

/** The SHA-256 of a bearer token, in lowercase hex: what a table stores in its place. */
export const TokenDigest = Schema.String.pipe(
	Schema.check(Schema.isPattern(/^[0-9a-f]{64}$/u)),
	Schema.brand("TokenDigest"),
);

export type TokenDigest = typeof TokenDigest.Type;

/**
 * Store a session token, an API key or a one-time code by its digest, so a
 * read of the database (a leaked dump, a stolen connection string) yields no
 * usable credential; a lookup hashes the presented value and matches on it.
 *
 * Unsalted SHA-256 is enough because the input is a high-entropy random token
 * (or a short code behind a rate limit), never a password: a password needs a
 * slow, salted hash this function is not.
 */
export function tokenDigest(
	token: string | Redacted.Redacted<string>,
): Effect.Effect<TokenDigest> {
	const value = Redacted.isRedacted(token) ? Redacted.value(token) : token;
	return Effect.promise(async () =>
		TokenDigest.make(
			hexFromBytes(await crypto.subtle.digest("SHA-256", utf8Bytes(value))),
		),
	);
}
