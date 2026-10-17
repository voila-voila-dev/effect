import { WarningCircleIcon } from "@phosphor-icons/react";
import type * as React from "react";
import type { AudioPlayback } from "#/audio-player/hooks/use-audio-playback.ts";
import {
	type AudioPlayerLabels,
	audioPlayerLabels,
} from "#/audio-player/lib/audio-player-labels.ts";
import { Slider } from "#/slider/components/slider.tsx";

interface Props
	extends Omit<
		React.ComponentProps<typeof Slider.Root>,
		"value" | "onValueChange" | "min" | "max" | "step"
	> {
	playback: AudioPlayback;
	labels?: Partial<Pick<AudioPlayerLabels, "position" | "unavailable">>;
}

/** The playhead as a slider, or the reason there is nothing to play. */
export function AudioPlayerSeekBar({
	playback,
	labels: overrides,
	...props
}: Props) {
	const labels = audioPlayerLabels(overrides);
	if (playback.failed) {
		return (
			<p
				data-slot="audio-player-unavailable"
				className="flex items-center gap-2 text-sm text-destructive"
			>
				<WarningCircleIcon />
				{labels.unavailable}
			</p>
		);
	}
	// A zero-length range would pin the thumb; a hair of length keeps it at the start.
	const max = Math.max(playback.duration, 0.01);
	return (
		<Slider.Root
			data-slot="audio-player-seek-bar"
			aria-label={labels.position}
			min={0}
			max={max}
			step={0.1}
			value={Math.min(playback.current, max)}
			onValueChange={(value) =>
				playback.moveTo(Array.isArray(value) ? (value[0] ?? 0) : value)
			}
			{...props}
		/>
	);
}
