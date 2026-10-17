import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cn } from "#/lib/utils.ts";

interface Props extends useRender.ComponentProps<"span"> {}

/** Names the thing the widget is about, on one truncated line. */
export function ChatWidgetTitle({ className, render, ...props }: Props) {
	return useRender({
		defaultTagName: "span",
		props: mergeProps<"span">(
			{ className: cn("truncate text-sm font-medium", className) },
			props,
		),
		render,
		state: { slot: "chat-widget-title" },
	});
}
