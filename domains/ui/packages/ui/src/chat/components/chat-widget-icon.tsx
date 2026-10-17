import type * as React from "react";
import { cn } from "#/lib/utils.ts";

interface Props extends React.ComponentProps<"span"> {}

/** Decorative: the icon says what kind of thing the widget is; the title names it. */
export function ChatWidgetIcon({ className, ...props }: Props) {
	return (
		<span
			data-slot="chat-widget-icon"
			aria-hidden
			className={cn(
				"flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-foreground [&_svg]:size-4",
				className,
			)}
			{...props}
		/>
	);
}
