import { UserIcon, XIcon } from "@phosphor-icons/react";
import { useId, useState } from "react";
import { Chip } from "#/chip/components/chip.tsx";
import { FilterFieldFrame } from "#/filter/components/fields/filter-field-frame.tsx";
import { FilterFieldInput } from "#/filter/components/fields/filter-field-input.tsx";
import { FilterOperatorToggle } from "#/filter/components/fields/filter-operator-toggle.tsx";
import { LookupResults } from "#/filter/components/fields/lookup-results.tsx";
import { useDebouncedLookup } from "#/filter/hooks/use-debounced-lookup.ts";
import { useFilterLabels } from "#/filter/hooks/use-filter-labels.ts";
import type {
	EntityFilterDefinition,
	EntityFilterOption,
	EntityFilterValue,
} from "#/filter/types.ts";

interface Props {
	definition: EntityFilterDefinition;
	value: EntityFilterValue | undefined;
	onValueChange: (value: EntityFilterValue | undefined) => void;
}

/**
 * "Is one of these records": search-as-you-type suggestions instead of a fixed
 * option list, the picked records shown as removable chips above the box. The
 * label rides along in the value, so chips and shared URLs render names
 * without asking the backend again.
 */
export function EntityFilterField({ definition, value, onValueChange }: Props) {
	const labels = useFilterLabels();
	const controlId = useId();
	const [query, setQuery] = useState("");
	const { results, busy } = useDebouncedLookup(query, definition.searchOptions);

	const entities = value?.entities ?? [];
	const excluded = value?.excluded === true;
	const selectedIds = new Set(entities.map((entity) => entity.id));

	function update(next: ReadonlyArray<EntityFilterOption>) {
		onValueChange(
			next.length === 0
				? undefined
				: { kind: "entity", entities: next, ...(excluded ? { excluded } : {}) },
		);
	}

	function pick(entity: EntityFilterOption) {
		setQuery("");
		if (selectedIds.has(entity.id)) {
			return;
		}
		update(definition.multiple === true ? [...entities, entity] : [entity]);
	}

	return (
		<FilterFieldFrame
			label={definition.label}
			description={definition.description}
			controlId={controlId}
			operator={
				definition.allowExclusion === true ? (
					<FilterOperatorToggle
						excluded={excluded}
						disabled={entities.length === 0}
						onExcludedChange={(nextExcluded) =>
							onValueChange({
								kind: "entity",
								entities,
								...(nextExcluded ? { excluded: true } : {}),
							})
						}
					/>
				) : undefined
			}
			onClear={entities.length > 0 ? () => onValueChange(undefined) : undefined}
		>
			{entities.length > 0 && (
				<div className="flex flex-wrap gap-1.5">
					{entities.map((entity) => (
						<Chip.Root key={entity.id} variant="outline" className="max-w-full">
							<span className="truncate">{entity.label}</span>
							<Chip.Remove
								aria-label={`${labels.remove}: ${entity.label}`}
								onClick={() =>
									update(entities.filter((kept) => kept.id !== entity.id))
								}
							>
								<XIcon />
							</Chip.Remove>
						</Chip.Root>
					))}
				</div>
			)}
			<FilterFieldInput
				id={controlId}
				value={query}
				placeholder={definition.searchPlaceholder ?? labels.searchPlaceholder}
				autoComplete="off"
				onChange={(event) => setQuery(event.target.value)}
			/>
			<LookupResults
				results={results}
				busy={busy}
				query={query}
				noResults={labels.entityNoResults}
				icon={<UserIcon />}
				onPick={pick}
			/>
		</FilterFieldFrame>
	);
}
