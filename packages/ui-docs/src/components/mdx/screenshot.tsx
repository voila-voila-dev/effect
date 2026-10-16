import { lazy, type ReactNode, Suspense, useState } from "react";
import { cn } from "../../lib/cn.ts";

import { useDocs } from "../docs-provider.tsx";

/** The device a capture was taken on, which picks the frame drawn around it. */
export type ScreenshotFrame = "browser" | "phone";

export interface ScreenshotProps {
	src: string;
	/** The file's own size in pixels: it reserves the space before the image loads. */
	width: number;
	height: number;
	/** What the capture shows, for a reader who cannot see it. */
	alt: string;
	frame?: ScreenshotFrame;
	/** The address the browser frame shows. */
	url?: string;
	caption?: ReactNode;
}

function BrowserFrame({
	url,
	children,
}: {
	url: string | undefined;
	children: ReactNode;
}) {
	return (
		<div className="overflow-hidden rounded-xl bg-background shadow-[0_24px_48px_-16px_rgb(15_18_60/0.28),0_0_0_1px_rgb(15_18_60/0.08)] dark:shadow-[0_24px_48px_-16px_rgb(0_0_0/0.6),0_0_0_1px_rgb(255_255_255/0.08)]">
			<div className="flex h-8 items-center gap-3 border-b px-3 sm:h-9">
				<span className="flex shrink-0 gap-1.5" aria-hidden>
					<span className="size-2.5 rounded-full bg-foreground/15" />
					<span className="size-2.5 rounded-full bg-foreground/15" />
					<span className="size-2.5 rounded-full bg-foreground/15" />
				</span>
				{url ? (
					<span className="mx-auto max-w-[70%] truncate rounded-md bg-foreground/[0.05] px-3 py-0.5 text-center font-mono text-[0.6875rem] text-muted-foreground">
						{url}
					</span>
				) : null}
				<span className="w-[2.625rem] shrink-0" aria-hidden />
			</div>
			{children}
		</div>
	);
}

function PhoneFrame({ children }: { children: ReactNode }) {
	return (
		<div className="mx-auto w-full max-w-[min(18rem,70%)] rounded-[2.75rem] bg-docs-bezel p-2.5 shadow-[0_32px_56px_-20px_rgb(15_18_60/0.45),0_0_0_1px_rgb(15_18_60/0.12)] ring-1 ring-white/10 dark:shadow-[0_32px_56px_-20px_rgb(0_0_0/0.7)]">
			<div className="overflow-hidden rounded-[2.25rem]">{children}</div>
		</div>
	);
}

const FRAMES: Readonly<
	Record<
		ScreenshotFrame,
		(props: { url: string | undefined; children: ReactNode }) => ReactNode
	>
> = {
	browser: BrowserFrame,
	phone: PhoneFrame,
};

/**
 * A capture of the product inside the device it was taken on, on the brand's
 * backdrop. Clicking it opens the full-size image, whose dialog loads on the
 * first hover, focus or click.
 */
function loadZoom() {
	return import("./screenshot-zoom.tsx");
}

const ScreenshotZoom = lazy(() =>
	loadZoom().then(({ ScreenshotZoom: loadedZoom }) => ({
		default: loadedZoom,
	})),
);

export function Screenshot({
	src,
	width,
	height,
	alt,
	frame = "browser",
	url,
	caption,
}: ScreenshotProps) {
	const { messages } = useDocs();
	const [open, setOpen] = useState(false);
	const [requested, setRequested] = useState(false);
	const Frame = FRAMES[frame];
	const image = (
		<img
			src={src}
			width={width}
			height={height}
			alt={alt}
			loading="lazy"
			decoding="async"
			className="block h-auto w-full"
		/>
	);
	return (
		<figure className="docs-screenshot">
			<button
				type="button"
				aria-haspopup="dialog"
				onPointerEnter={loadZoom}
				onFocus={loadZoom}
				onClick={() => {
					setRequested(true);
					setOpen(true);
				}}
				className={cn(
					"docs-screenshot-backdrop group block w-full cursor-zoom-in rounded-2xl border px-3 py-4 outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-10",
					frame === "phone" && "sm:py-12",
				)}
				aria-label={messages.screenshotZoom(alt)}
			>
				<div className="transition-transform duration-300 ease-out group-hover:-translate-y-0.5">
					<Frame url={url}>{image}</Frame>
				</div>
			</button>
			{requested ? (
				<Suspense fallback={null}>
					<ScreenshotZoom
						src={src}
						width={width}
						height={height}
						alt={alt}
						frame={frame}
						open={open}
						onOpenChange={setOpen}
					/>
				</Suspense>
			) : null}
			{caption ? (
				<figcaption className="mt-3 text-center text-docs-sm text-muted-foreground">
					{caption}
				</figcaption>
			) : null}
		</figure>
	);
}
