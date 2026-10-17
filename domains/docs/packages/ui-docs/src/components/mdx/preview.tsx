import type { ReactNode } from "react";

import { cn } from "../../lib/cn.ts";

export interface PreviewProps {
	/** A short caption above the example: "Sizes", "Disabled". */
	label?: string;
	/** `row` wraps the examples inline, `stack` gives each the full width, `center` centers them. */
	layout?: "row" | "stack" | "center";
	/** A wide example scrolls inside the frame instead of widening the page. */
	scroll?: boolean;
	children: ReactNode;
}

/**
 * A live example, rendered on a faint grid so a ghost or transparent component
 * still reads as sitting on a surface. The frame is `not-prose`: the page's
 * typography stays out of the components it shows.
 */
export function Preview({
	label,
	layout = "row",
	scroll = false,
	children,
}: PreviewProps) {
	return (
		<div
			className={cn("docs-preview not-prose", scroll && "docs-preview-scroll")}
		>
			{label ? <p className="docs-preview-label">{label}</p> : null}
			<div className="docs-preview-stage" data-layout={layout}>
				{children}
			</div>
		</div>
	);
}
