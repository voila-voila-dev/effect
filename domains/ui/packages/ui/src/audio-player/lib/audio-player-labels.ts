/** Every string the player shows or announces, so it reads in any language. */
export interface AudioPlayerLabels {
	readonly play: string;
	readonly pause: string;
	readonly back: (seconds: number) => string;
	readonly forward: (seconds: number) => string;
	readonly position: string;
	readonly speed: string;
	/** How a speed reads on its button, e.g. `1.5×` (or `1,5×` in French). */
	readonly rate: (rate: number) => string;
	readonly download: string;
	readonly unavailable: string;
}

const ENGLISH_LABELS: AudioPlayerLabels = {
	play: "Play",
	pause: "Pause",
	back: (seconds) => `Back ${seconds} seconds`,
	forward: (seconds) => `Forward ${seconds} seconds`,
	position: "Playback position",
	speed: "Playback speed",
	rate: (rate) => `${rate}×`,
	download: "Download",
	unavailable: "This recording can't be played.",
};

/** The English labels with the caller's overrides on top. */
export function audioPlayerLabels(
	overrides: Partial<AudioPlayerLabels> = {},
): AudioPlayerLabels {
	return { ...ENGLISH_LABELS, ...overrides };
}
