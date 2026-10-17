import type * as React from "react";
import { AudioPlayerDownloadButton } from "#/audio-player/components/audio-player-download-button.tsx";
import { AudioPlayerPlayToggle } from "#/audio-player/components/audio-player-play-toggle.tsx";
import { AudioPlayerSeekBar } from "#/audio-player/components/audio-player-seek-bar.tsx";
import { AudioPlayerSkipButtons } from "#/audio-player/components/audio-player-skip-buttons.tsx";
import { AudioPlayerSpeedToggle } from "#/audio-player/components/audio-player-speed-toggle.tsx";
import type { AudioPlayback } from "#/audio-player/hooks/use-audio-playback.ts";
import {
	type AudioPlayerLabels,
	audioPlayerLabels,
} from "#/audio-player/lib/audio-player-labels.ts";
import { DEFAULT_PLAYBACK_RATES } from "#/audio-player/lib/playback-rates.ts";
import { formatPlaybackClock } from "#/audio-player/lib/playhead.ts";
import { cn } from "#/lib/utils.ts";

interface Props extends Omit<React.ComponentProps<"div">, "title"> {
	playback: AudioPlayback;
	/** The file the download button offers; the panel itself plays nothing. */
	src: string;
	title: React.ReactNode;
	description?: React.ReactNode;
	playbackRates?: ReadonlyArray<number>;
	skipSeconds?: number;
	/** Offers the file as a download under this name; no button without it. */
	downloadName?: string;
	labels?: Partial<AudioPlayerLabels>;
	/** False inside a card of its own: the controls without their border and padding. */
	frame?: boolean;
}

/**
 * The player card over a playback held elsewhere (`useAudioPlayback`), so the
 * `<audio>` element can outlive it.
 */
export function AudioPlayerPanel({
	playback,
	src,
	title,
	description,
	playbackRates = DEFAULT_PLAYBACK_RATES,
	skipSeconds = 15,
	downloadName,
	labels: overrides,
	frame = true,
	className,
	...props
}: Props) {
	const labels = audioPlayerLabels(overrides);
	return (
		<div
			data-slot="audio-player"
			data-playing={playback.playing}
			className={cn(
				"flex flex-col gap-3",
				frame && "rounded-xl border bg-card p-4 text-card-foreground",
				className,
			)}
			{...props}
		>
			<div className="flex items-center gap-3">
				<AudioPlayerPlayToggle playback={playback} labels={labels} />
				<div className="flex min-w-0 flex-1 flex-col">
					<span className="truncate text-sm font-medium">{title}</span>
					<span className="truncate text-xs text-muted-foreground">
						{description}
					</span>
				</div>
				<span
					data-slot="audio-player-clock"
					className="shrink-0 text-sm text-muted-foreground tabular-nums"
				>
					{`${formatPlaybackClock(playback.current)} / ${formatPlaybackClock(playback.duration)}`}
				</span>
			</div>
			<AudioPlayerSeekBar playback={playback} labels={labels} />
			<div className="flex flex-wrap items-center justify-between gap-2">
				<AudioPlayerSkipButtons
					playback={playback}
					seconds={skipSeconds}
					labels={labels}
				/>
				<div className="flex items-center gap-2">
					<AudioPlayerSpeedToggle
						rate={playback.rate}
						onRateChange={playback.chooseRate}
						rates={playbackRates}
						labels={labels}
					/>
					{downloadName !== undefined && (
						<AudioPlayerDownloadButton
							src={src}
							name={downloadName}
							labels={labels}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
