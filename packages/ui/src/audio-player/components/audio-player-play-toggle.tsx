import { PauseIcon, PlayIcon } from "@phosphor-icons/react";
import type * as React from "react";
import type { AudioPlayback } from "#/audio-player/hooks/use-audio-playback.ts";
import {
	type AudioPlayerLabels,
	audioPlayerLabels,
} from "#/audio-player/lib/audio-player-labels.ts";
import { Button } from "#/button/components/button.tsx";
import { cn } from "#/lib/utils.ts";
import { Spinner } from "#/spinner/components/spinner.tsx";

interface Props
	extends Omit<
		React.ComponentProps<typeof Button>,
		"children" | "onClick" | "size"
	> {
	playback: AudioPlayback;
	labels?: Partial<Pick<AudioPlayerLabels, "play" | "pause">>;
	size?: "icon-sm" | "icon" | "icon-lg";
}

/** The round play/pause button; a spinner while playing but still buffering. */
export function AudioPlayerPlayToggle({
	playback,
	labels: overrides,
	size = "icon-lg",
	className,
	...props
}: Props) {
	const labels = audioPlayerLabels(overrides);
	return (
		<Button
			data-slot="audio-player-play-toggle"
			size={size}
			className={cn("shrink-0 rounded-full", className)}
			aria-label={playback.playing ? labels.pause : labels.play}
			disabled={playback.failed}
			onClick={playback.toggle}
			{...props}
		>
			{playback.playing && playback.waiting ? (
				<Spinner />
			) : playback.playing ? (
				<PauseIcon weight="fill" />
			) : (
				<PlayIcon weight="fill" />
			)}
		</Button>
	);
}
