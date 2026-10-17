/**
 * Lowercased and stripped of its accents, so "etude" reaches "Étude". Someone
 * typing one-handed will not reach for the accents, and a list that hides a
 * row over one is a list that looks empty.
 */
export function normalizeLabel(value: string): string {
	return value
		.toLowerCase()
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "");
}
