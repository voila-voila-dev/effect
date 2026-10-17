const REGIONAL_INDICATOR_A = 0x1_f1_e6;
const LETTER_A = 0x41;

/**
 * The emoji flag of an ISO 3166-1 alpha-2 code: its letters as regional
 * indicator symbols, which every platform draws as the flag. Empty for
 * anything that is not two letters, so no stray symbol reaches the page.
 */
export function countryFlag(code: string): string {
	return /^[A-Za-z]{2}$/u.test(code)
		? String.fromCodePoint(
				...[...code.toUpperCase()].map(
					(letter) =>
						REGIONAL_INDICATOR_A + (letter.codePointAt(0) ?? 0) - LETTER_A,
				),
			)
		: "";
}
