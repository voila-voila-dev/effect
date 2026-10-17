// @vitest-environment jsdom
import {
	act,
	cleanup,
	fireEvent,
	render,
	within,
} from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	AudioPlayer,
	type AudioPlayerHandle,
	clampPlayhead,
	formatPlaybackClock,
	nextPlaybackRate,
	useAudioPlayback,
} from "#/audio-player/index.ts";

beforeEach(() => {
	vi.stubGlobal(
		"ResizeObserver",
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	);
	// jsdom has no media pipeline: play and pause only flip the state and fire
	// the events a browser would.
	Object.defineProperty(HTMLMediaElement.prototype, "play", {
		configurable: true,
		value(this: HTMLMediaElement) {
			Object.defineProperty(this, "paused", {
				configurable: true,
				value: false,
			});
			this.dispatchEvent(new Event("play"));
			return Promise.resolve();
		},
	});
	Object.defineProperty(HTMLMediaElement.prototype, "pause", {
		configurable: true,
		value(this: HTMLMediaElement) {
			Object.defineProperty(this, "paused", {
				configurable: true,
				value: true,
			});
			this.dispatchEvent(new Event("pause"));
		},
	});
});

afterEach(cleanup);

function audioOf(container: HTMLElement): HTMLAudioElement {
	const audio = container.querySelector("audio");
	if (!(audio instanceof HTMLAudioElement)) throw new Error("no audio element");
	return audio;
}

function renderPlayer(ref = createRef<AudioPlayerHandle>()) {
	const view = render(
		<AudioPlayer.Root
			ref={ref}
			src="https://example.test/call.mp3"
			title="Call"
			description="Jane Doe"
			durationSeconds={41}
			downloadName="call.mp3"
		/>,
	);
	return { view, audio: audioOf(view.container), ref };
}

describe("AudioPlayer.Root", () => {
	it("shows the known length before the file has loaded", () => {
		const { view } = renderPlayer();
		expect(view.getByText("0:00 / 0:41")).toBeTruthy();
		expect(view.getByText("Call")).toBeTruthy();
	});

	it("plays and pauses from its own button", async () => {
		const { view } = renderPlayer();
		await act(async () => {
			fireEvent.click(view.getByRole("button", { name: "Play" }));
		});
		expect(view.getByRole("button", { name: "Pause" })).toBeTruthy();
		await act(async () => {
			fireEvent.click(view.getByRole("button", { name: "Pause" }));
		});
		expect(view.getByRole("button", { name: "Play" })).toBeTruthy();
	});

	it("skips forward and back within the recording", async () => {
		const { view, audio } = renderPlayer();
		await act(async () => {
			fireEvent.click(view.getByRole("button", { name: "Forward 15 seconds" }));
		});
		expect(audio.currentTime).toBe(15);
		await act(async () => {
			fireEvent.click(view.getByRole("button", { name: "Back 15 seconds" }));
			fireEvent.click(view.getByRole("button", { name: "Back 15 seconds" }));
		});
		expect(audio.currentTime).toBe(0);
	});

	it("lets a caller seek and play from a moment", async () => {
		const { view, audio, ref } = renderPlayer();
		await act(async () => ref.current?.seek(24.5));
		expect(audio.currentTime).toBe(24.5);
		expect(view.getByText("0:24 / 0:41")).toBeTruthy();
		expect(view.getByRole("button", { name: "Pause" })).toBeTruthy();
	});

	it("steps the playback speed from one button", async () => {
		const { view, audio } = renderPlayer();
		const speed = view.getByRole("button", { name: /Playback speed/u });
		await act(async () => {
			fireEvent.click(speed);
		});
		expect(speed.textContent).toBe("1.5×");
		await act(async () => {
			fireEvent.click(speed);
		});
		expect(audio.playbackRate).toBe(2);
	});

	it("reads every label from the caller", async () => {
		const view = render(
			<AudioPlayer.Root
				src="https://example.test/call.mp3"
				title="Appel"
				labels={{
					play: "Lire",
					rate: (rate) => `${String(rate).replace(".", ",")}×`,
				}}
				rate={1.5}
				onRateChange={() => undefined}
			/>,
		);
		expect(view.getByRole("button", { name: "Lire" })).toBeTruthy();
		expect(
			view.getByRole("button", { name: "Playback speed, 1,5×" }),
		).toBeTruthy();
	});

	it("plays at a speed its caller holds", async () => {
		const changes: number[] = [];
		const view = render(
			<AudioPlayer.Root
				src="https://example.test/call.mp3"
				title="Call"
				rate={1.5}
				onRateChange={(rate) => changes.push(rate)}
			/>,
		);
		expect(audioOf(view.container).playbackRate).toBe(1.5);
		await act(async () => {
			fireEvent.click(view.getByRole("button", { name: /Playback speed/u }));
		});
		expect(changes).toEqual([2]);
	});

	it("offers the file for download under the given name", () => {
		const { view } = renderPlayer();
		const link = view.getByLabelText("Download");
		expect(link.tagName).toBe("A");
		expect(link.getAttribute("download")).toBe("call.mp3");
	});

	it("says so when the file cannot be played", async () => {
		const { view, audio } = renderPlayer();
		await act(async () => {
			audio.dispatchEvent(new Event("error"));
		});
		expect(view.getByText("This recording can't be played.")).toBeTruthy();
	});
});

describe("formatPlaybackClock", () => {
	it("reads minutes and seconds, and nothing for an unknown length", () => {
		expect(formatPlaybackClock(69.9)).toBe("1:09");
		expect(formatPlaybackClock(Number.POSITIVE_INFINITY)).toBe("0:00");
	});
});

describe("nextPlaybackRate", () => {
	it("cycles 1× → 1.5× → 2× → 1×", () => {
		expect(nextPlaybackRate(1)).toBe(1.5);
		expect(nextPlaybackRate(1.5)).toBe(2);
		expect(nextPlaybackRate(2)).toBe(1);
	});

	it("starts over from the first speed it does not know", () => {
		expect(nextPlaybackRate(1.25)).toBe(1);
	});
});

describe("clampPlayhead", () => {
	it("stops a skip at either end of the recording", () => {
		expect(clampPlayhead(-4, 41)).toBe(0);
		expect(clampPlayhead(55, 41)).toBe(41);
		expect(clampPlayhead(12.5, 41)).toBe(12.5);
	});
});

function SharedPlayback({ src }: { readonly src: string }) {
	const playback = useAudioPlayback({ src, durationSeconds: 41 });
	return (
		<>
			<audio {...playback.element} />
			<div data-testid="mini">
				<AudioPlayer.PlayToggle playback={playback} />
				<AudioPlayer.SkipButtons playback={playback} seconds={10} />
			</div>
			<AudioPlayer.Panel playback={playback} src={src} title="Call" />
		</>
	);
}

describe("useAudioPlayback", () => {
	it("keeps every control over one element in step", async () => {
		const view = render(<SharedPlayback src="https://example.test/a.mp3" />);
		const audio = audioOf(view.container);
		const mini = within(view.getByTestId("mini"));
		await act(async () => {
			fireEvent.click(mini.getByRole("button", { name: "Play" }));
		});
		expect(view.getAllByRole("button", { name: "Pause" })).toHaveLength(2);
		await act(async () => {
			fireEvent.click(mini.getByRole("button", { name: "Forward 10 seconds" }));
		});
		expect(audio.currentTime).toBe(10);
		expect(view.getByText("0:10 / 0:41")).toBeTruthy();
	});

	it("starts a new source over at zero", async () => {
		const view = render(<SharedPlayback src="https://example.test/a.mp3" />);
		const mini = within(view.getByTestId("mini"));
		await act(async () => {
			fireEvent.click(mini.getByRole("button", { name: "Forward 10 seconds" }));
		});
		view.rerender(<SharedPlayback src="https://example.test/b.mp3" />);
		expect(view.getByText("0:00 / 0:41")).toBeTruthy();
	});
});
