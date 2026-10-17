import {
	ArrowClockwiseIcon,
	ArrowCounterClockwiseIcon,
} from "@phosphor-icons/react";
import type * as React from "react";
import type { AudioPlayback } from "#/audio-player/hooks/use-audio-playback.ts";
import {
	type AudioPlayerLabels,
	audioPlayerLabels,
} from "#/audio-player/lib/audio-player-labels.ts";
import { Button } from "#/button/components/button.tsx";
import { cn } from "#/lib/utils.ts";

interface Props extends React.ComponentProps<"div"> {
	playback: AudioPlayback;
	/** How far one press moves. */
	seconds?: number;
	labels?: Partial<Pick<AudioPlayerLabels, "back" | "forward">>;
}

/** Back and forward by a fixed step, stopping at either end. */
export function AudioPlayerSkipButtons({
	playback,
	seconds = 15,
	labels: overrides,
	className,
	...props
}: Props) {
	const labels = audioPlayerLabels(overrides);
	return (
		<div
			data-slot="audio-player-skip-buttons"
			className={cn("flex items-center gap-1", className)}
			{...props}
		>
			<Button
				size="icon-sm"
				variant="ghost"
				aria-label={labels.back(seconds)}
				disabled={playback.failed}
				onClick={() => playback.moveTo(playback.current - seconds)}
			>
				<ArrowCounterClockwiseIcon />
			</Button>
			<Button
				size="icon-sm"
				variant="ghost"
				aria-label={labels.forward(seconds)}
				disabled={playback.failed}
				onClick={() => playback.moveTo(playback.current + seconds)}
			>
				<ArrowClockwiseIcon />
			</Button>
		</div>
	);
}
