import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cn } from "#/lib/utils.ts";

interface Props extends useRender.ComponentProps<"div"> {}

/** Holds the one control the widget offers, stretched to the full width. */
export function ChatWidgetAction({ className, render, ...props }: Props) {
	return useRender({
		defaultTagName: "div",
		props: mergeProps<"div">(
			{ className: cn("flex flex-col [&>*]:w-full", className) },
			props,
		),
		render,
		state: { slot: "chat-widget-action" },
	});
}
