import { Dialog } from "@base-ui/react/dialog";
import { XIcon } from "@phosphor-icons/react";
import { cn } from "../../lib/cn.ts";

import { useDocs } from "../docs-provider.tsx";
import type { ScreenshotProps } from "./screenshot.tsx";

export function ScreenshotZoom({
	src,
	width,
	height,
	alt,
	frame,
	open,
	onOpenChange,
}: Pick<ScreenshotProps, "src" | "width" | "height" | "alt" | "frame"> & {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { messages } = useDocs();
	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Backdrop className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
				<Dialog.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none transition duration-200 data-[ending-style]:scale-[0.98] data-[starting-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 sm:p-10">
					<Dialog.Title className="sr-only">{alt}</Dialog.Title>
					<Dialog.Close
						className="absolute inset-0 cursor-zoom-out"
						aria-label={messages.screenshotClose}
					/>
					<img
						src={src}
						width={width}
						height={height}
						alt={alt}
						className={cn(
							"relative size-auto max-h-full max-w-full rounded-xl object-contain shadow-2xl",
							frame === "phone" && "rounded-[2rem]",
						)}
					/>
					<Dialog.Close
						className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
						aria-label={messages.screenshotClose}
					>
						<XIcon className="size-4" weight="bold" aria-hidden />
					</Dialog.Close>
				</Dialog.Popup>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
