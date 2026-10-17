import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cn } from "#/lib/utils.ts";

interface Props extends useRender.ComponentProps<"span"> {}

/** A muted line under the title: a date, a size, an amount. */
export function ChatWidgetDetail({ className, render, ...props }: Props) {
	return useRender({
		defaultTagName: "span",
		props: mergeProps<"span">(
			{
				className: cn("truncate text-xs text-muted-foreground", className),
			},
			props,
		),
		render,
		state: { slot: "chat-widget-detail" },
	});
}
