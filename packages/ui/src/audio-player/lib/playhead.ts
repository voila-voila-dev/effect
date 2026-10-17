/** `m:ss`; an unknown length (`NaN`, `Infinity`) reads as `0:00`. */
export function formatPlaybackClock(seconds: number): string {
	const whole = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
	return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/** A skip past either end stops at that end. */
export function clampPlayhead(seconds: number, duration: number): number {
	return Math.min(Math.max(0, seconds), Math.max(0, duration));
}

/**
 * A webm or a stream reports `Infinity` until its end is known; the caller's
 * figure stands in until then.
 */
export function knownDuration(
	element: HTMLMediaElement,
	fallback: number,
): number {
	return Number.isFinite(element.duration) && element.duration > 0
		? element.duration
		: fallback;
}
