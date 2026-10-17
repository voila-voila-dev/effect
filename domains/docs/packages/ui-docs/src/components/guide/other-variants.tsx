import { useDocsGuide } from "../docs-guide.tsx";
import { DocsLink } from "../docs-link.tsx";
import { useDocs } from "../docs-provider.tsx";
import { useReaderContext } from "../reader-context.tsx";

/** The same guide written for other countries, each with the context it is for. */
export function OtherVariants() {
	const { messages } = useDocs();
	const { variants } = useDocsGuide();
	const { restrictionLabel, restrictionsOf } = useReaderContext();
	if (variants.length === 0) {
		return null;
	}
	return (
		<section className="mt-10">
			<h2 className="mb-3 font-semibold text-docs-sm text-foreground">
				{messages.readerContext.variantsTitle}
			</h2>
			<ul className="m-0 list-none space-y-2 p-0 text-docs-sm">
				{variants.map((variant) => (
					<li key={variant.href}>
						<DocsLink
							href={variant.href}
							className="font-medium text-foreground underline underline-offset-4"
						>
							{variant.title}
						</DocsLink>
						<span className="ml-2 text-muted-foreground">
							{restrictionLabel(restrictionsOf(variant.appliesTo))}
						</span>
					</li>
				))}
			</ul>
		</section>
	);
}
