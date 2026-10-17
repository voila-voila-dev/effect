import { Schema } from "effect";

/**
 * What the receiving side concluded about one check (SPF, DKIM or DMARC) on a
 * received message. `Unknown` covers a check the provider did not report and
 * a value it reported that we do not recognise: either way we know nothing,
 * which is more honest to store than a made-up pass or fail.
 */
export const EMAIL_AUTHENTICATION_VERDICTS = [
	"Pass",
	"Fail",
	"Unknown",
] as const;

export const EmailAuthenticationVerdict = Schema.Literals(
	EMAIL_AUTHENTICATION_VERDICTS,
);

export type EmailAuthenticationVerdict = typeof EmailAuthenticationVerdict.Type;
