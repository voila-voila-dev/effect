/** What `AudioPlayer.Root`'s `ref` exposes. */
export interface AudioPlayerHandle {
	/** Moves the playhead and plays from there, as a click on a transcript line expects. */
	readonly seek: (seconds: number) => void;
}
