import { NotePencilIcon } from "@phosphor-icons/react";
import * as React from "react";
import { cn } from "#/lib/utils.ts";
import { Popover } from "#/popover/components/popover.tsx";
import { Textarea } from "#/textarea/components/textarea.tsx";

interface Props
	extends Omit<React.ComponentProps<"button">, "value" | "children"> {
	value: string;
	onValueChange: (value: string) => void;
	/** Accessible name for the trigger (the preview alone rarely identifies it). */
	ariaLabel: string;
	/** Shown muted while the value is empty, in the trigger and the editor. */
	placeholder?: string;
	/** Tints the cell and raises its destructive ring, like any invalid control. */
	invalid?: boolean;
	maxLength?: number;
	/** Classes for the editor surface (width, height bounds). */
	contentClassName?: string;
	/** Classes for the trigger button that sits in the cell. */
	className?: string;
}

/** The value's first line — what a one-line preview can honestly show. */
function previewText(value: string): string {
	const [firstLine] = value.split("\n", 1);
	return firstLine ?? "";
}

/**
 * Multi-line text behind a one-line cell: the closed state is a flush preview
 * of the first line (so a long note never stretches its table row), and
 * opening it drops an anchored editor — a real textarea, as wide as the cell
 * and overlaying its line — where the text is written with line breaks.
 * Escape or clicking away closes it; ⌘/Ctrl+Enter closes it from the keyboard
 * without leaving the text.
 *
 * Made for a `Spreadsheet.Cell` (which flattens it like any control and draws
 * the focus/invalid ring itself), but self-contained: anywhere a single line
 * must summarize a paragraph works the same.
 */
export function ExpandingTextareaInput({
	value,
	onValueChange,
	ariaLabel,
	placeholder,
	invalid,
	maxLength,
	contentClassName,
	className,
	...props
}: Props) {
	const [open, setOpen] = React.useState(false);
	const empty = value.trim().length === 0;
	const shown = empty ? placeholder : previewText(value);

	return (
		<Popover.Root open={open} onOpenChange={setOpen}>
			<Popover.Trigger
				data-slot="expanding-textarea-input"
				aria-label={ariaLabel}
				aria-invalid={invalid}
				data-empty={empty || undefined}
				className={cn(
					"flex h-9 w-full items-center justify-between gap-1 bg-transparent px-2.5 text-left text-sm outline-none",
					"text-foreground data-empty:text-muted-foreground",
					className,
				)}
				{...props}
			>
				<span className="truncate">{shown}</span>
				<NotePencilIcon className="size-3.5 shrink-0 text-muted-foreground" />
			</Popover.Trigger>
			<Popover.Content
				align="start"
				// Overlay the editor on the cell itself: its first line sits where
				// the preview was, so opening reads as the cell unfolding in place.
				sideOffset={-36}
				className={cn("w-(--anchor-width) min-w-80 p-1", contentClassName)}
			>
				<Textarea
					// Opening IS the intent to type: focus lands in the text.
					autoFocus
					aria-label={ariaLabel}
					aria-invalid={invalid}
					placeholder={placeholder}
					maxLength={maxLength}
					value={value}
					onChange={(event) => onValueChange(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
							event.preventDefault();
							setOpen(false);
						}
					}}
					// The popover is the chrome; a second border inside it is noise.
					className="min-h-24 border-0 shadow-none focus-visible:ring-0 aria-invalid:ring-0"
				/>
			</Popover.Content>
		</Popover.Root>
	);
}
