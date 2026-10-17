import { Predicate, Schema } from "effect";
import type { AuthenticationVerdict, ReceivedEmail } from "./received-email.ts";

// The receiving response is not documented field by field, so it is read
// tolerantly: known fields picked, verdicts read from whatever pass/fail
// string Resend reports, at the top level or under `authentication`.

export const ReceivedEmailAnswer = Schema.Struct({
	text: Schema.optionalKey(Schema.NullOr(Schema.String)),
	html: Schema.optionalKey(Schema.NullOr(Schema.String)),
	spf: Schema.optionalKey(Schema.Unknown),
	dkim: Schema.optionalKey(Schema.Unknown),
	dmarc: Schema.optionalKey(Schema.Unknown),
	authentication: Schema.optionalKey(
		Schema.Struct({
			spf: Schema.optionalKey(Schema.Unknown),
			dkim: Schema.optionalKey(Schema.Unknown),
			dmarc: Schema.optionalKey(Schema.Unknown),
		}),
	),
	headers: Schema.optionalKey(
		Schema.NullOr(Schema.Record(Schema.String, Schema.Unknown)),
	),
});

type ReceivedEmailAnswer = typeof ReceivedEmailAnswer.Type;

export const ReceivedAttachmentAnswer = Schema.Struct({
	download_url: Schema.optionalKey(Schema.NullOr(Schema.String)),
	url: Schema.optionalKey(Schema.NullOr(Schema.String)),
	content_type: Schema.optionalKey(Schema.NullOr(Schema.String)),
});

/** A verdict arrives as a bare `"pass"` or wrapped as `{ status: "pass" }`. */
function verdictText(value: unknown): string {
	if (typeof value === "string") return value;
	const status = Predicate.hasProperty(value, "status")
		? value.status
		: undefined;
	return typeof status === "string" ? status : "";
}

function verdictOf(value: unknown): AuthenticationVerdict {
	const normalized = verdictText(value).toLowerCase();
	if (normalized.includes("pass")) return "Pass";
	if (normalized.includes("fail")) return "Fail";
	return "Unknown";
}

function headersOf(
	raw: Readonly<Record<string, unknown>> | null | undefined,
): Record<string, string> {
	const headers: Record<string, string> = {};
	for (const [name, value] of Object.entries(raw ?? {})) {
		if (typeof value === "string") headers[name.toLowerCase()] = value;
	}
	return headers;
}

export function readReceivedEmail(answer: ReceivedEmailAnswer): ReceivedEmail {
	const verdict = (key: "spf" | "dkim" | "dmarc") =>
		verdictOf(answer[key] ?? answer.authentication?.[key]);
	return {
		text: answer.text ?? "",
		html: answer.html ?? null,
		spf: verdict("spf"),
		dkim: verdict("dkim"),
		dmarc: verdict("dmarc"),
		headers: headersOf(answer.headers),
	};
}
