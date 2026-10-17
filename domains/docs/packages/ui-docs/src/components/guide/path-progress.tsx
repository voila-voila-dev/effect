import { cn } from "../../lib/cn.ts";

import { useDocsGuide } from "../docs-guide.tsx";
import { DocsLink } from "../docs-link.tsx";
import { useDocs } from "../docs-provider.tsx";

/** "Step 3 of 7 · From sign-up to first invoice", over one segment per step that opens it. */
export function PathProgress() {
	const { messages } = useDocs();
	const { place } = useDocsGuide();
	if (!place) {
		return null;
	}
	const { path, index } = place;
	const context = path.steps[index]?.context;
	return (
		<nav
			aria-label={messages.guide.pathStepsAria}
			className="mb-8 rounded-2xl border border-border px-4 py-3.5"
		>
			<p className="flex flex-wrap items-baseline gap-x-2 text-docs-sm">
				<span className="font-medium text-foreground">
					{messages.guide.pathProgress(index + 1, path.steps.length)}
				</span>
				<span aria-hidden className="text-muted-foreground">
					·
				</span>
				<DocsLink
					href={path.href}
					className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
				>
					{path.title}
				</DocsLink>
			</p>
			<ol className="mt-3 flex gap-1">
				{path.steps.map((step, position) => (
					<li key={step.href} className="flex-1">
						<DocsLink
							href={step.href}
							title={step.title}
							aria-label={step.title}
							aria-current={position === index ? "step" : undefined}
							className={cn(
								"block h-1.5 rounded-full transition-colors",
								position <= index
									? "bg-foreground"
									: "bg-foreground/15 hover:bg-foreground/30",
							)}
						/>
					</li>
				))}
			</ol>
			{context ? (
				<p className="mt-3 text-docs-sm text-muted-foreground">{context}</p>
			) : null}
		</nav>
	);
}
