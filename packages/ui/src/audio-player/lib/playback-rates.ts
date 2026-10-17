/** The speeds a listener skims at; the first is where a player starts. */
export const DEFAULT_PLAYBACK_RATES: ReadonlyArray<number> = [1, 1.5, 2];

/** The speed after `rate` in `rates`, back to the first after the last. */
export function nextPlaybackRate(
	rate: number,
	rates: ReadonlyArray<number> = DEFAULT_PLAYBACK_RATES,
): number {
	return rates[(rates.indexOf(rate) + 1) % rates.length] ?? rate;
}
