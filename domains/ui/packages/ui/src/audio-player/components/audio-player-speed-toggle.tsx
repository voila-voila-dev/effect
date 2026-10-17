import type * as React from "react";
import {
	type AudioPlayerLabels,
	audioPlayerLabels,
} from "#/audio-player/lib/audio-player-labels.ts";
import {
	DEFAULT_PLAYBACK_RATES,
	nextPlaybackRate,
} from "#/audio-player/lib/playback-rates.ts";
import { Button } from "#/button/components/button.tsx";
import { cn } from "#/lib/utils.ts";

// React declares `onRateChange` as a media event on every element; here it is
// the chosen speed, so the DOM one is dropped.
interface Props
	extends Omit<
		React.ComponentProps<typeof Button>,
		"children" | "onClick" | "onRateChange"
	> {
	rate: number;
	onRateChange: (rate: number) => void;
	rates?: ReadonlyArray<number>;
	labels?: Partial<Pick<AudioPlayerLabels, "speed" | "rate">>;
}

/** One button that steps through the speeds, its label the current one. */
export function AudioPlayerSpeedToggle({
	rate,
	onRateChange,
	rates = DEFAULT_PLAYBACK_RATES,
	labels: overrides,
	className,
	...props
}: Props) {
	const labels = audioPlayerLabels(overrides);
	const shown = labels.rate(rate);
	return (
		<Button
			data-slot="audio-player-speed-toggle"
			size="xs"
			variant="ghost"
			className={cn("min-w-10 tabular-nums", className)}
			aria-label={`${labels.speed}, ${shown}`}
			title={labels.speed}
			onClick={() => onRateChange(nextPlaybackRate(rate, rates))}
			{...props}
		>
			{shown}
		</Button>
	);
}
