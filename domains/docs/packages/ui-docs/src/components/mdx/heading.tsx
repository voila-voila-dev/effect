import { LinkSimpleIcon } from "@phosphor-icons/react";
import type { ComponentProps } from "react";
import { useDocs } from "../docs-provider.tsx";

function anchoredHeading(Tag: "h2" | "h3") {
	return function AnchoredHeading({
		id,
		children,
		...props
	}: ComponentProps<"h2">) {
		const { messages } = useDocs();
		return (
			<Tag id={id} {...props} className="group/heading relative">
				{id ? (
					<a
						href={`#${id}`}
						aria-label={messages.headingAnchor}
						className="absolute top-1/2 -left-8 hidden size-6 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground no-underline opacity-0 transition-opacity hover:bg-foreground/5 hover:text-foreground focus-visible:opacity-100 group-hover/heading:opacity-100 md:flex"
					>
						<LinkSimpleIcon className="size-3.5" weight="bold" aria-hidden />
					</a>
				) : null}
				{children}
			</Tag>
		);
	};
}

export const H2 = anchoredHeading("h2");
export const H3 = anchoredHeading("h3");
