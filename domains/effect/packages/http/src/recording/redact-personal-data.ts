// Errs toward over-masking: this is defense in depth for an error body headed
// to a log, not a parser. Order matters: emails first, so the digits of an
// address are not rewritten, and digit groups before phones, so no phone match
// leaves the rest of a card number behind.

const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/giu;
// Card, account and national identity numbers, often written in groups.
const SPACED_DIGITS = /\b\d(?: ?\d){12,}\b/gu;
// A national number (0X XX XX XX XX) or an international one (+44 …), never the
// digits inside a longer number or a uuid.
const PHONE =
	/(?<![\w-])(?:0[\s.-]?[1-9](?:[\s.-]?\d{2}){4}|\+[1-9]\d{0,2}(?:[\s.-]?\d){6,12})(?![\w-])/gu;
const LONG_DIGITS = /\b\d{9,}\b/gu;

/** `text` with emails, phone numbers and long digit runs masked. */
export function redactPersonalData(text: string): string {
	return text
		.replace(EMAIL, "«email»")
		.replace(SPACED_DIGITS, "«id»")
		.replace(PHONE, "«phone»")
		.replace(LONG_DIGITS, "«id»");
}
