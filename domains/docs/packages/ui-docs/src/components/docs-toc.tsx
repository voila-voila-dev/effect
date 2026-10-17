import { TextAlignLeftIcon } from "@phosphor-icons/react";
import type { DocHeading } from "@voila.dev/docs/heading";
import { useEffect, useId, useState } from "react";
import { cn } from "../lib/cn.ts";
import { useDocs } from "./docs-provider.tsx";

/** A section is being read once its heading reaches the top third of the screen. */
function readingLine(): number {
	return window.innerHeight / 3;
}

function currentHeadingId(ids: ReadonlyArray<string>): string | undefined {
	const atBottom =
		window.innerHeight + window.scrollY >=
		document.documentElement.scrollHeight - 4;
	if (atBottom) {
		return ids.at(-1);
	}
	const line = readingLine();
	return ids
		.filter((id) => {
			const top = document
				.querySelector<HTMLElement>(`#${CSS.escape(id)}`)
				?.getBoundingClientRect().top;
			return top !== undefined && top <= line;
		})
		.at(-1);
}

function useActiveHeading(ids: ReadonlyArray<string>): string | undefined {
	const [active, setActive] = useState<string>();
	const key = ids.join(" ");
	useEffect(() => {
		const watched = key.split(" ");
		let frame = 0;
		function update() {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => setActive(currentHeadingId(watched)));
		}
		update();
		window.addEventListener("scroll", update, { passive: true });
		window.addEventListener("resize", update);
		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener("scroll", update);
			window.removeEventListener("resize", update);
		};
	}, [key]);
	return active;
}

/**
 * "Sur cette page": a line down the left, the section being read drawn over it.
 * A page without a section (a guide's index) has no outline, and nothing to
 * watch while it scrolls.
 */
export function DocsToc({ headings }: { headings: ReadonlyArray<DocHeading> }) {
	return headings.length === 0 ? null : <DocsTocList headings={headings} />;
}

function DocsTocList({ headings }: { headings: ReadonlyArray<DocHeading> }) {
	const baseId = useId();
	const active = useActiveHeading(headings.map((heading) => heading.id));
	const { messages } = useDocs();
	return (
		<nav aria-labelledby={`${baseId}-docs-toc-title`} className="text-docs-sm">
			<p
				id={`${baseId}-docs-toc-title`}
				className="mb-3 flex items-center gap-2 font-medium text-foreground"
			>
				<TextAlignLeftIcon className="size-4" aria-hidden />
				{messages.tocTitle}
			</p>
			<ul className="border-border border-l">
				{headings.map((heading) => (
					<li key={heading.id}>
						<a
							href={`#${heading.id}`}
							aria-current={heading.id === active ? "location" : undefined}
							className={cn(
								"-ml-px block border-l py-1 leading-6 transition-colors",
								heading.depth === 3 ? "pl-7" : "pl-4",
								heading.id === active
									? "border-foreground font-medium text-foreground"
									: "border-transparent text-foreground/65 hover:text-foreground",
							)}
						>
							{heading.text}
						</a>
					</li>
				))}
			</ul>
		</nav>
	);
}
