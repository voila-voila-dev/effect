import { GlobeHemisphereWestIcon } from "@phosphor-icons/react";
import { useState } from "react";

import {
	type DocsReaderDimensionView,
	type DocsReaderOption,
	useDocs,
} from "./docs-provider.tsx";
import { ReaderContextPicker, useReaderContext } from "./reader-context.tsx";

function Answer({
	view,
	option,
}: {
	view: DocsReaderDimensionView;
	option: DocsReaderOption;
}) {
	return option.flag ? (
		<span className="inline-flex items-center gap-1">
			<span
				role="img"
				aria-label={option.label}
				className="text-sm leading-none"
			>
				{option.flag}
			</span>
			{view.shortLabel}
		</span>
	) : (
		<span>
			{view.shortLabel} {option.label}
		</span>
	);
}

/** The sidebar's reminder of the countries the reader chose, and the place to change them. */
export function ReaderContextChip({ audience }: { audience: string }) {
	const { messages } = useDocs();
	const { views, context } = useReaderContext();
	const [open, setOpen] = useState(false);
	const asked = views.filter((view) => view.audiences.includes(audience));
	if (asked.length === 0) {
		return null;
	}
	const answers = asked.flatMap((view) => {
		const option = view.options.find(
			(each) => each.value === context[view.name],
		);
		return option ? [{ view, option }] : [];
	});
	return (
		<section
			aria-label={messages.readerContext.title}
			className="overflow-hidden rounded-xl border border-border bg-background shadow-xs"
		>
			<div className="flex h-9 items-center gap-1 pr-1 pl-2.5 text-xs">
				<span
					className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden whitespace-nowrap text-foreground/80"
					title={answers
						.map(({ view, option }) =>
							messages.readerContext.restriction(view.shortLabel, option.label),
						)
						.join(" · ")}
				>
					{answers.length > 0 ? (
						answers.map(({ view, option }, index) => (
							<span key={view.name} className="inline-flex items-center gap-1">
								{index > 0 ? (
									<span aria-hidden className="text-muted-foreground/60">
										·
									</span>
								) : null}
								<Answer view={view} option={option} />
							</span>
						))
					) : (
						<>
							<GlobeHemisphereWestIcon
								className="size-4 shrink-0 text-muted-foreground"
								aria-hidden
							/>
							<span className="truncate">{messages.readerContext.choose}</span>
						</>
					)}
				</span>
				<button
					type="button"
					aria-expanded={open}
					onClick={() => setOpen(!open)}
					className="docs-control h-7 shrink-0 rounded-lg px-1.5 font-medium text-foreground transition-colors hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring/40"
				>
					{open ? messages.readerContext.close : messages.readerContext.change}
				</button>
			</div>
			{open ? (
				<div className="border-border border-t bg-foreground/[0.015] px-3 pt-2.5 pb-3">
					<ReaderContextPicker audience={audience} compact />
				</div>
			) : null}
		</section>
	);
}
