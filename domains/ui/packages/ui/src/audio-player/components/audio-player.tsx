import { AudioPlayerDownloadButton } from "#/audio-player/components/audio-player-download-button.tsx";
import { AudioPlayerPanel } from "#/audio-player/components/audio-player-panel.tsx";
import { AudioPlayerPlayToggle } from "#/audio-player/components/audio-player-play-toggle.tsx";
import { AudioPlayerRoot } from "#/audio-player/components/audio-player-root.tsx";
import { AudioPlayerSeekBar } from "#/audio-player/components/audio-player-seek-bar.tsx";
import { AudioPlayerSkipButtons } from "#/audio-player/components/audio-player-skip-buttons.tsx";
import { AudioPlayerSpeedToggle } from "#/audio-player/components/audio-player-speed-toggle.tsx";

/**
 * The AudioPlayer parts as one namespace. `Root` is the whole card with its
 * own `<audio>`; `Panel` is the same card over a `useAudioPlayback` held
 * elsewhere; the controls compose any smaller player over that same playback.
 */
export const AudioPlayer = {
	Root: AudioPlayerRoot,
	DownloadButton: AudioPlayerDownloadButton,
	Panel: AudioPlayerPanel,
	PlayToggle: AudioPlayerPlayToggle,
	SeekBar: AudioPlayerSeekBar,
	SkipButtons: AudioPlayerSkipButtons,
	SpeedToggle: AudioPlayerSpeedToggle,
};
