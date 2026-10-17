import { Schema } from "effect";

/**
 * An address a provider will accept, `local@domain.tld`. Deliberately
 * stricter than RFC 5322: quoted local parts and IP literals are valid on
 * paper and refused by every sending API.
 */
export const EmailAddress = Schema.String.pipe(
	Schema.check(
		Schema.isPattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/u),
	),
).pipe(Schema.brand("EmailAddress"));

export type EmailAddress = typeof EmailAddress.Type;
