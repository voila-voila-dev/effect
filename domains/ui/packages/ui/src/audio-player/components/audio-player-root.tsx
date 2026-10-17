import * as React from "react";
import { AudioPlayerPanel } from "#/audio-player/components/audio-player-panel.tsx";
import { useAudioPlayback } from "#/audio-player/hooks/use-audio-playback.ts";
import type { AudioPlayerHandle } from "#/audio-player/lib/audio-player-handle.ts";
import { DEFAULT_PLAYBACK_RATES } from "#/audio-player/lib/playback-rates.ts";

// React declares `onRateChange` as a media event on every element; here it is
// the chosen speed, so the DOM one is dropped.
interface Props
	extends Omit<
		React.ComponentProps<typeof AudioPlayerPanel>,
		"playback" | "ref" | "onRateChange"
	> {
	/** The length the caller already knows, shown until the file's own metadata arrives. */
	durationSeconds?: number | null;
	/** A speed held by the caller (a user preference); the player keeps its own otherwise. */
	rate?: number;
	onRateChange?: (rate: number) => void;
	onTimeChange?: (seconds: number) => void;
	ref?: React.Ref<AudioPlayerHandle>;
}

/**
 * One recording as a card: its name, a play button, a seek bar, skips and the
 * speeds a listener skims at. The `<audio>` element stays hidden so every
 * browser draws the same controls, and the handle lets a transcript drive the
 * playhead. To keep playing while the card unmounts, hold `useAudioPlayback`
 * higher up and render `AudioPlayer.Panel` instead.
 */
export function AudioPlayerRoot({
	durationSeconds,
	rate,
	onRateChange,
	onTimeChange,
	ref,
	...panel
}: Props) {
	const playback = useAudioPlayback({
		src: panel.src,
		durationSeconds,
		initialRate: (panel.playbackRates ?? DEFAULT_PLAYBACK_RATES)[0] ?? 1,
		rate,
		onRateChange,
		onTimeChange,
	});

	React.useImperativeHandle(ref, () => ({ seek: playback.playFrom }));

	return (
		<>
			<audio {...playback.element} />
			<AudioPlayerPanel playback={playback} {...panel} />
		</>
	);
}
