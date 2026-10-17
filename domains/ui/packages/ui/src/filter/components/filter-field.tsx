import { FilterEditor } from "#/filter/components/fields/filter-editor.tsx";
import { FilterProvider } from "#/filter/components/filter-provider.tsx";
import type {
	FilterDefinition,
	FilterLabels,
	FilterValue,
} from "#/filter/types.ts";

interface Props {
	/** The one filter to render. Its `kind` picks the editor. */
	definition: FilterDefinition;
	/** The current value, or `undefined` when this filter is not active. */
	value: FilterValue | undefined;
	/** Called with `undefined` when the field is cleared, which is how a filter is removed. */
	onValueChange: (value: FilterValue | undefined) => void;
	/**
	 * Overrides for the strings this field shows, merged over the surrounding
	 * filter root's (English defaults at the outermost level).
	 */
	labels?: Partial<FilterLabels>;
	/** BCP 47 tag used to format this field's numbers, money and dates; inherited when omitted. */
	locale?: string;
}

/**
 * Renders the editor a definition's `kind` asks for, followed by the
 * definition's `renderPreview` when it has one.
 */
export function FilterField({
	definition,
	value,
	onValueChange,
	labels,
	locale,
}: Props) {
	const editor = (
		<FilterEditor
			definition={definition}
			value={value}
			onValueChange={onValueChange}
		/>
	);
	return (
		<FilterProvider labels={labels} locale={locale}>
			{definition.renderPreview === undefined ? (
				editor
			) : (
				<div className="flex min-w-0 flex-col gap-3">
					{editor}
					{definition.renderPreview(value)}
				</div>
			)}
		</FilterProvider>
	);
}
