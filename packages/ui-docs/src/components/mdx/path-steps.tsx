import { useDocsGuide } from "../docs-guide.tsx";
import { DocsLink } from "../docs-link.tsx";
import { useDocs } from "../docs-provider.tsx";
import { STEP_ITEM, STEP_LIST } from "./steps.tsx";

/** On a path's own page, its steps in order from the registry, each opening the step inside the path. */
export function PathSteps() {
	const { messages } = useDocs();
	const { introduces } = useDocsGuide();
	if (!introduces) {
		throw new Error(
			"<PathSteps /> belongs on the page a path of the registry names",
		);
	}
	return (
		<ol aria-label={messages.guide.pathStepsAria} className={STEP_LIST}>
			{introduces.steps.map((step) => (
				<li key={step.href} className={STEP_ITEM}>
					<DocsLink
						href={step.href}
						className="font-medium text-foreground text-lg leading-7 underline-offset-4 hover:underline"
					>
						{step.title}
					</DocsLink>
					{step.description ? (
						<p className="mt-1 text-muted-foreground">{step.description}</p>
					) : null}
					{step.context ? (
						<p className="mt-1 text-docs-sm text-foreground/75">
							{step.context}
						</p>
					) : null}
				</li>
			))}
		</ol>
	);
}
