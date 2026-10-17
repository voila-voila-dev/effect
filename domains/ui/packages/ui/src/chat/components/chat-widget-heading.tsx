import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cn } from "#/lib/utils.ts";

interface Props extends useRender.ComponentProps<"div"> {}

/** Stacks the widget's title over its detail line. */
export function ChatWidgetHeading({ className, render, ...props }: Props) {
	return useRender({
		defaultTagName: "div",
		props: mergeProps<"div">(
			{ className: cn("flex min-w-0 flex-1 flex-col", className) },
			props,
		),
		render,
		state: { slot: "chat-widget-heading" },
	});
}
