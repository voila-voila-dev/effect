import {
	AudioPlayer,
	type AudioPlayerHandle,
	useAudioPlayback,
} from "@voila.dev/ui/audio-player";
import { useEffect, useRef, useState } from "react";

const SAMPLE_RATE = 8000;

/**
 * A few seconds of a soft two-note chime as a WAV blob, so the preview plays
 * something real without shipping an audio file with the docs.
 */
function chimeWav(seconds: number): Blob {
	const samples = Math.floor(SAMPLE_RATE * seconds);
	const buffer = new ArrayBuffer(44 + samples * 2);
	const view = new DataView(buffer);
	const ascii = (offset: number, text: string) => {
		for (let index = 0; index < text.length; index++) {
			view.setUint8(offset + index, text.charCodeAt(index));
		}
	};
	ascii(0, "RIFF");
	view.setUint32(4, 36 + samples * 2, true);
	ascii(8, "WAVE");
	ascii(12, "fmt ");
	view.setUint32(16, 16, true);
	view.setUint16(20, 1, true);
	view.setUint16(22, 1, true);
	view.setUint32(24, SAMPLE_RATE, true);
	view.setUint32(28, SAMPLE_RATE * 2, true);
	view.setUint16(32, 2, true);
	view.setUint16(34, 16, true);
	ascii(36, "data");
	view.setUint32(40, samples * 2, true);
	for (let index = 0; index < samples; index++) {
		const time = index / SAMPLE_RATE;
		const note = Math.floor(time * 2) % 2 === 0 ? 440 : 660;
		const envelope = Math.exp(-3 * (time % 0.5));
		const value = Math.sin(2 * Math.PI * note * time) * envelope * 0.25;
		view.setInt16(44 + index * 2, value * 0x7fff, true);
	}
	return new Blob([buffer], { type: "audio/wav" });
}

/** An object URL for the chime, made in the browser only (the docs prerender). */
function useChimeUrl(seconds: number): string | null {
	const [url, setUrl] = useState<string | null>(null);
	useEffect(() => {
		const next = URL.createObjectURL(chimeWav(seconds));
		setUrl(next);
		return () => URL.revokeObjectURL(next);
	}, [seconds]);
	return url;
}

export function Default() {
	const src = useChimeUrl(30);
	return (
		<div className="w-full max-w-md">
			{src !== null && (
				<AudioPlayer.Root
					src={src}
					title="Kickoff call"
					description="Jane Doe · 30 s"
					durationSeconds={30}
					downloadName="kickoff-call.wav"
				/>
			)}
		</div>
	);
}

const transcript = [
	{ at: 0, text: "Thanks for joining." },
	{ at: 8, text: "Let's go over the scope." },
	{ at: 17, text: "Next steps for Friday." },
];

export function Transcript() {
	const src = useChimeUrl(30);
	const player = useRef<AudioPlayerHandle>(null);
	return (
		<div className="flex w-full max-w-md flex-col gap-3">
			{src !== null && (
				<AudioPlayer.Root
					ref={player}
					src={src}
					title="Kickoff call"
					durationSeconds={30}
				/>
			)}
			<ol className="flex flex-col gap-1 text-sm">
				{transcript.map((line) => (
					<li key={line.at}>
						<button
							type="button"
							className="text-left hover:underline"
							onClick={() => player.current?.seek(line.at)}
						>
							<span className="me-2 text-muted-foreground tabular-nums">
								0:{String(line.at).padStart(2, "0")}
							</span>
							{line.text}
						</button>
					</li>
				))}
			</ol>
		</div>
	);
}

export function Compact() {
	const src = useChimeUrl(12);
	const playback = useAudioPlayback({ src, durationSeconds: 12 });
	return (
		<div className="flex items-center gap-2 rounded-full border px-2 py-1">
			<audio {...playback.element} />
			<AudioPlayer.PlayToggle playback={playback} size="icon-sm" />
			<AudioPlayer.SpeedToggle
				rate={playback.rate}
				onRateChange={playback.chooseRate}
			/>
		</div>
	);
}
