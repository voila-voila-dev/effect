import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { cn } from "../lib/cn.ts";

import { useCopy } from "../lib/use-copy.ts";

interface CopyButtonProps {
	text: () => string | Promise<string>;
	label: string;
	copiedLabel: string;
	className?: string;
	showLabel?: boolean;
}

export function CopyButton({
	text,
	label,
	copiedLabel,
	className,
	showLabel = false,
}: CopyButtonProps) {
	const { copied, copy } = useCopy();
	const Icon = copied ? CheckIcon : CopyIcon;
	const shownLabel = copied ? copiedLabel : label;
	return (
		<button
			type="button"
			onClick={() => copy(text())}
			aria-label={showLabel ? undefined : label}
			title={showLabel ? undefined : label}
			className={cn(
				"inline-flex items-center gap-1.5 rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground",
				className,
			)}
		>
			<Icon
				className={cn("size-4", copied && "text-docs-success")}
				weight={copied ? "bold" : "regular"}
				aria-hidden
			/>
			{showLabel ? <span>{shownLabel}</span> : null}
			<span className="sr-only" aria-live="polite">
				{copied ? copiedLabel : ""}
			</span>
		</button>
	);
}
