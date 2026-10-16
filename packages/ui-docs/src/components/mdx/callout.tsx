import {
	type Icon,
	InfoIcon,
	LightbulbIcon,
	WarningIcon,
	WarningOctagonIcon,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn.ts";

export type CalloutVariant = "note" | "tip" | "warning" | "danger";

const CALLOUT_STYLES: Readonly<
	Record<CalloutVariant, { Icon: Icon; frame: string; icon: string }>
> = {
	note: {
		Icon: InfoIcon,
		frame: "border-border bg-foreground/[0.03]",
		icon: "text-foreground/60",
	},
	tip: {
		Icon: LightbulbIcon,
		frame: "border-docs-success/25 bg-docs-success/[0.06]",
		icon: "text-docs-success",
	},
	warning: {
		Icon: WarningIcon,
		frame: "border-docs-warning/35 bg-docs-warning/[0.08]",
		icon: "text-docs-warning",
	},
	danger: {
		Icon: WarningOctagonIcon,
		frame: "border-destructive/25 bg-destructive/[0.06]",
		icon: "text-destructive",
	},
};

export interface CalloutProps {
	variant?: CalloutVariant;
	title?: string;
	children: ReactNode;
}

export function Callout({ variant = "note", title, children }: CalloutProps) {
	const { Icon: CalloutIcon, frame, icon } = CALLOUT_STYLES[variant];
	return (
		<aside
			className={cn(
				"flex gap-3 rounded-2xl border px-4 py-3.5 text-docs-sm leading-7",
				frame,
			)}
		>
			<CalloutIcon
				className={cn("mt-1.5 size-4 shrink-0", icon)}
				weight="bold"
				aria-hidden
			/>
			<div className="docs-flow min-w-0 [&>*+*]:mt-2">
				{title ? (
					<p className="font-semibold text-foreground">{title}</p>
				) : null}
				{children}
			</div>
		</aside>
	);
}

function calloutOf(variant: CalloutVariant) {
	return function VariantCallout(props: Omit<CalloutProps, "variant">) {
		return <Callout {...props} variant={variant} />;
	};
}

export const Note = calloutOf("note");
export const Tip = calloutOf("tip");
export const Warning = calloutOf("warning");
export const Danger = calloutOf("danger");
