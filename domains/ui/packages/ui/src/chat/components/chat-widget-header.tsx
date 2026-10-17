import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cn } from "#/lib/utils.ts";

interface Props extends useRender.ComponentProps<"div"> {}

/** The widget's icon and heading, side by side. */
export function ChatWidgetHeader({ className, render, ...props }: Props) {
	return useRender({
		defaultTagName: "div",
		props: mergeProps<"div">(
			{ className: cn("flex min-w-0 items-center gap-3", className) },
			props,
		),
		render,
		state: { slot: "chat-widget-header" },
	});
}
