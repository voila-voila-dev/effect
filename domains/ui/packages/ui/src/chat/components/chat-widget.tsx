import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cn } from "#/lib/utils.ts";

interface Props extends useRender.ComponentProps<"div"> {}

/**
 * A widget embedded in a thread: the thing a message is about, standing under
 * the bubble with one way to act on it — a document to download, a record to
 * open, a payment to confirm — without the kit knowing any of them. Sized like
 * a bubble (the same width caps).
 *
 * Compose: `Widget > WidgetHeader (WidgetIcon + WidgetHeading > WidgetTitle +
 * WidgetDetail) + WidgetAction`.
 */
export function ChatWidget({ className, render, ...props }: Props) {
	return useRender({
		defaultTagName: "div",
		props: mergeProps<"div">(
			{
				className: cn(
					"flex w-full max-w-[85%] flex-col gap-3 rounded-lg border border-border bg-background p-3 sm:max-w-[75%]",
					className,
				),
			},
			props,
		),
		render,
		state: { slot: "chat-widget" },
	});
}
