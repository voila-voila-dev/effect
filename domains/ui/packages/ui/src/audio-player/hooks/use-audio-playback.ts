import * as React from "react";
import { clampPlayhead, knownDuration } from "#/audio-player/lib/playhead.ts";

/** `HTMLMediaElement.HAVE_NOTHING`: no metadata yet, so the length that bounds a move is unknown. */
const HAVE_NOTHING = 0;

/** One `<audio>` element's state, mirrored into React so any number of controls can drive it. */
export interface AudioPlayback {
	readonly playing: boolean;
	readonly waiting: boolean;
	readonly failed: boolean;
	readonly current: number;
	readonly duration: number;
	readonly rate: number;
	readonly toggle: () => void;
	readonly moveTo: (seconds: number) => void;
	/** Moves the playhead and plays; before the file's metadata arrives, the move waits for it. */
	readonly playFrom: (seconds: number) => void;
	readonly chooseRate: (rate: number) => void;
	/** Spread on the one `<audio>` element this state belongs to. */
	readonly element: React.ComponentProps<"audio"> & {
		readonly ref: React.RefObject<HTMLAudioElement | null>;
	};
}

export interface AudioPlaybackOptions {
	/** Null renders no source: nothing to play yet. */
	readonly src: string | null;
	/** The length the caller already knows, shown until the file's own metadata arrives. */
	readonly durationSeconds?: number | null;
	readonly initialRate?: number;
	/** A speed held elsewhere, such as a user preference; `initialRate` seeds it otherwise. */
	readonly rate?: number;
	readonly onRateChange?: (rate: number) => void;
	readonly onTimeChange?: (seconds: number) => void;
}

/**
 * The state of one audio element, kept apart from its controls: a page that
 * holds it above its tabs keeps playing while the controls showing it mount
 * and unmount. A new `src` starts over at zero; the chosen speed carries over.
 */
export function useAudioPlayback({
	src,
	durationSeconds,
	initialRate = 1,
	rate: controlledRate,
	onRateChange,
	onTimeChange,
}: AudioPlaybackOptions): AudioPlayback {
	const audio = React.useRef<HTMLAudioElement>(null);
	const pendingStart = React.useRef<number | null>(null);
	const knownLength = durationSeconds ?? 0;
	const [source, setSource] = React.useState(src);
	const [playing, setPlaying] = React.useState(false);
	const [waiting, setWaiting] = React.useState(false);
	const [failed, setFailed] = React.useState(false);
	const [current, setCurrent] = React.useState(0);
	const [duration, setDuration] = React.useState(knownLength);
	const [ownRate, setOwnRate] = React.useState(initialRate);
	const rate = controlledRate ?? ownRate;

	React.useEffect(() => {
		if (audio.current !== null) audio.current.playbackRate = rate;
	}, [rate]);

	// Reset during render rather than in an effect, so a new source never
	// paints one frame with the previous one's position.
	if (source !== src) {
		setSource(src);
		setPlaying(false);
		setWaiting(false);
		setFailed(false);
		setCurrent(0);
		setDuration(knownLength);
	}

	function report(seconds: number) {
		setCurrent(seconds);
		onTimeChange?.(seconds);
	}

	function moveTo(seconds: number) {
		const element = audio.current;
		if (element === null) return;
		const bounded = clampPlayhead(seconds, knownDuration(element, duration));
		element.currentTime = bounded;
		report(bounded);
	}

	function play() {
		audio.current?.play().catch(() => setFailed(true));
	}

	function toggle() {
		const element = audio.current;
		if (element === null) return;
		if (!element.paused) return element.pause();
		play();
	}

	function playFrom(seconds: number) {
		const element = audio.current;
		if (element === null) return;
		if (element.readyState === HAVE_NOTHING) {
			pendingStart.current = seconds;
			element.currentTime = seconds;
			report(seconds);
		} else {
			moveTo(seconds);
		}
		play();
	}

	function chooseRate(next: number) {
		setOwnRate(next);
		onRateChange?.(next);
	}

	return {
		playing,
		waiting,
		failed,
		current,
		duration,
		rate,
		toggle,
		moveTo,
		playFrom,
		chooseRate,
		element: {
			ref: audio,
			src: src ?? undefined,
			preload: "metadata",
			onLoadedMetadata: (event) => {
				setDuration(knownDuration(event.currentTarget, duration));
				event.currentTarget.playbackRate = rate;
				const start = pendingStart.current;
				pendingStart.current = null;
				if (start !== null) moveTo(start);
			},
			onDurationChange: (event) =>
				setDuration(knownDuration(event.currentTarget, duration)),
			onTimeUpdate: (event) => report(event.currentTarget.currentTime),
			onPlay: () => setPlaying(true),
			onPause: () => setPlaying(false),
			onEnded: () => setPlaying(false),
			onWaiting: () => setWaiting(true),
			onPlaying: () => setWaiting(false),
			onCanPlay: () => setWaiting(false),
			onError: () => setFailed(true),
		},
	};
}
