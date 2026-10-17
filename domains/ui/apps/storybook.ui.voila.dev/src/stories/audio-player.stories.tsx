import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { AudioPlayer, useAudioPlayback } from "@voila.dev/ui/audio-player";
import { useEffect, useState } from "react";

const SAMPLE_RATE = 8000;

/** A few seconds of a soft two-note chime, so the story plays something real. */
function chimeUrl(seconds: number): string {
	const samples = Math.floor(SAMPLE_RATE * seconds);
	const view = new DataView(new ArrayBuffer(44 + samples * 2));
	const ascii = (offset: number, text: string) => {
		for (let index = 0; index < text.length; index++) {
			view.setUint8(offset + index, text.charCodeAt(index));
		}
	};
	ascii(0, "RIFF");
	view.setUint32(4, 36 + samples * 2, true);
	ascii(8, "WAVEfmt ");
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
		const value =
			Math.sin(2 * Math.PI * note * time) * Math.exp(-3 * (time % 0.5)) * 0.25;
		view.setInt16(44 + index * 2, value * 0x7fff, true);
	}
	return URL.createObjectURL(new Blob([view.buffer], { type: "audio/wav" }));
}

function useChime(seconds: number): string | null {
	const [url, setUrl] = useState<string | null>(null);
	useEffect(() => {
		const next = chimeUrl(seconds);
		setUrl(next);
		return () => URL.revokeObjectURL(next);
	}, [seconds]);
	return url;
}

const meta = {
	title: "UI/AudioPlayer",
	component: AudioPlayer.Root,
	tags: ["autodocs"],
	args: { src: "", title: "Recording" },
} satisfies Meta<typeof AudioPlayer.Root>;

export default meta;

type Story = StoryObj<typeof meta>;

function Card() {
	const src = useChime(30);
	if (src === null) return null;
	return (
		<div className="w-96">
			<AudioPlayer.Root
				src={src}
				title="Kickoff call"
				description="Jane Doe · 30 s"
				durationSeconds={30}
				downloadName="kickoff-call.wav"
			/>
		</div>
	);
}

/** The whole card: play, seek, skip 15 s, step the speed, download. */
export const Default: Story = {
	render: () => <Card />,
};

/** A file that cannot be played says so instead of a seek bar. */
export const Unavailable: Story = {
	render: () => (
		<div className="w-96">
			<AudioPlayer.Root
				src="data:audio/wav;base64,AAAA"
				title="Broken file"
				durationSeconds={12}
			/>
		</div>
	),
};

function French() {
	const src = useChime(30);
	if (src === null) return null;
	return (
		<div className="w-96">
			<AudioPlayer.Root
				src={src}
				title="Appel"
				durationSeconds={30}
				labels={{
					play: "Lire",
					pause: "Mettre en pause",
					back: (seconds) => `Reculer de ${seconds} secondes`,
					forward: (seconds) => `Avancer de ${seconds} secondes`,
					position: "Position de lecture",
					speed: "Vitesse de lecture",
					rate: (rate) => `${String(rate).replace(".", ",")}×`,
					download: "Télécharger",
					unavailable: "Lecture impossible.",
				}}
			/>
		</div>
	);
}

/** Every string through `labels`, speeds included. */
export const Labels: Story = {
	render: () => <French />,
};

function Compact() {
	const src = useChime(12);
	const playback = useAudioPlayback({ src, durationSeconds: 12 });
	return (
		<div className="flex items-center gap-2 rounded-full border px-2 py-1">
			<audio {...playback.element} />
			<AudioPlayer.PlayToggle playback={playback} size="icon-sm" />
			<AudioPlayer.SkipButtons playback={playback} seconds={5} />
			<AudioPlayer.SpeedToggle
				rate={playback.rate}
				onRateChange={playback.chooseRate}
			/>
		</div>
	);
}

/** A smaller player composed from the parts over `useAudioPlayback`. */
export const Composed: Story = {
	render: () => <Compact />,
};
