import type { HttpMethod } from "@voila.dev/docs/api-reference/model";
import type { ReactNode } from "react";
import { cn } from "../lib/cn.ts";

type ChipTone = "neutral" | "blue" | "green" | "orange" | "red";

const TONES: Readonly<Record<ChipTone, { soft: string; solid: string }>> = {
	neutral: {
		soft: "bg-foreground/[0.06] text-foreground/75",
		solid: "bg-foreground text-background",
	},
	blue: {
		soft: "bg-docs-info/10 text-docs-info",
		solid: "bg-docs-info text-docs-info-foreground",
	},
	green: {
		soft: "bg-docs-success/12 text-[oklch(0.5_0.14_149)] dark:text-docs-success",
		solid: "bg-docs-success text-docs-success-foreground",
	},
	orange: {
		soft: "bg-docs-caution/12 text-[oklch(0.55_0.16_47)] dark:text-docs-caution",
		solid: "bg-docs-caution text-docs-caution-foreground",
	},
	red: {
		soft: "bg-destructive/10 text-destructive",
		solid: "bg-destructive text-destructive-foreground",
	},
};

const SIZES = {
	xs: "h-4 rounded-[0.3125rem] px-1 text-[0.5625rem] font-semibold uppercase",
	sm: "rounded-md px-1.5 py-0.5 text-xs",
	md: "h-7 rounded-lg px-2 text-sm font-medium uppercase",
} as const;

/** The docs' one chip: an HTTP method, a status, a type, "requis". */
export function Chip({
	tone = "neutral",
	size = "sm",
	solid = false,
	className,
	children,
}: {
	tone?: ChipTone;
	size?: keyof typeof SIZES;
	solid?: boolean;
	className?: string;
	children: ReactNode;
}) {
	return (
		<span
			className={cn(
				"inline-flex shrink-0 items-center whitespace-nowrap font-mono leading-none",
				SIZES[size],
				solid ? TONES[tone].solid : TONES[tone].soft,
				className,
			)}
		>
			{children}
		</span>
	);
}

const METHOD_TONES: Readonly<Record<HttpMethod, ChipTone>> = {
	get: "green",
	post: "blue",
	put: "orange",
	patch: "orange",
	delete: "red",
	head: "neutral",
	options: "neutral",
	trace: "neutral",
};

export function methodTone(method: HttpMethod): ChipTone {
	return METHOD_TONES[method];
}

const STATUS_TONES: Readonly<Record<string, ChipTone>> = {
	"2": "green",
	"3": "blue",
	"4": "orange",
	"5": "red",
};

export function statusTone(status: string): ChipTone {
	return STATUS_TONES[status.charAt(0)] ?? "neutral";
}
