import { DownloadSimpleIcon } from "@phosphor-icons/react";
import type * as React from "react";
import {
	type AudioPlayerLabels,
	audioPlayerLabels,
} from "#/audio-player/lib/audio-player-labels.ts";
import { Button } from "#/button/components/button.tsx";

interface Props
	extends Omit<
		React.ComponentProps<typeof Button>,
		"children" | "render" | "nativeButton"
	> {
	src: string;
	/** The file name the browser saves under. */
	name: string;
	labels?: Partial<Pick<AudioPlayerLabels, "download">>;
}

/** The recording as a download link, styled as an icon button. */
export function AudioPlayerDownloadButton({
	src,
	name,
	labels: overrides,
	...props
}: Props) {
	const { download } = audioPlayerLabels(overrides);
	return (
		<Button
			data-slot="audio-player-download"
			size="icon-sm"
			variant="ghost"
			nativeButton={false}
			render={
				<a href={src} download={name} aria-label={download} title={download}>
					<DownloadSimpleIcon />
				</a>
			}
			{...props}
		/>
	);
}
