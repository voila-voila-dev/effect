import { MapPinIcon } from "@phosphor-icons/react";
import { useId, useState } from "react";
import { Button } from "#/button/components/button.tsx";
import { FilterFieldFrame } from "#/filter/components/fields/filter-field-frame.tsx";
import { FilterFieldInput } from "#/filter/components/fields/filter-field-input.tsx";
import { LookupResults } from "#/filter/components/fields/lookup-results.tsx";
import { useDebouncedLookup } from "#/filter/hooks/use-debounced-lookup.ts";
import { useFilterLabels } from "#/filter/hooks/use-filter-labels.ts";
import type {
	GeoRadiusFilterDefinition,
	GeoRadiusFilterValue,
} from "#/filter/types.ts";
import { RadiusMap } from "#/radius-map/components/radius-map.tsx";
import { Slider } from "#/slider/components/slider.tsx";

const DEFAULT_MIN_KM = 5;
const DEFAULT_MAX_KM = 200;
const DEFAULT_STEP_KM = 5;
const DEFAULT_RADIUS_KM = 30;

interface Props {
	definition: GeoRadiusFilterDefinition;
	value: GeoRadiusFilterValue | undefined;
	onValueChange: (value: GeoRadiusFilterValue | undefined) => void;
}

/**
 * "Within N km of somewhere": pick a place, then size the circle. The map is
 * the answer to "is that the area I meant?" — a lat/lon pair and a number are
 * not something anyone can picture.
 */
export function GeoRadiusFilterField({
	definition,
	value,
	onValueChange,
}: Props) {
	const labels = useFilterLabels();
	const controlId = useId();
	const [query, setQuery] = useState("");
	const { results, busy } = useDebouncedLookup(query, definition.searchPlaces);

	const minKm = definition.minKm ?? DEFAULT_MIN_KM;
	const maxKm = definition.maxKm ?? DEFAULT_MAX_KM;

	if (value === undefined) {
		return (
			<FilterFieldFrame
				label={definition.label}
				description={definition.description}
				controlId={controlId}
			>
				<FilterFieldInput
					id={controlId}
					value={query}
					placeholder={labels.placePlaceholder}
					onChange={(event) => setQuery(event.target.value)}
				/>
				<LookupResults
					results={results}
					busy={busy}
					query={query}
					noResults={labels.placeNoResults}
					icon={<MapPinIcon />}
					onPick={(place) => {
						setQuery("");
						onValueChange({
							kind: "geoRadius",
							place,
							radiusKm: definition.defaultKm ?? DEFAULT_RADIUS_KM,
						});
					}}
				/>
			</FilterFieldFrame>
		);
	}

	return (
		<FilterFieldFrame
			label={definition.label}
			description={definition.description}
			onClear={() => onValueChange(undefined)}
		>
			<div className="flex items-center gap-2">
				<MapPinIcon className="size-4 shrink-0 text-muted-foreground" />
				<span className="min-w-0 flex-1 truncate text-sm">
					{value.place.label}
				</span>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => onValueChange(undefined)}
				>
					{labels.changePlace}
				</Button>
			</div>

			<RadiusMap center={value.place} radiusKm={value.radiusKm} />

			<div className="flex items-center gap-3">
				<span className="shrink-0 text-muted-foreground text-sm">
					{labels.radius}
				</span>
				<Slider.Root
					aria-label={labels.radius}
					className="flex-1"
					min={minKm}
					max={maxKm}
					step={definition.stepKm ?? DEFAULT_STEP_KM}
					value={value.radiusKm}
					onValueChange={(next) =>
						onValueChange({
							...value,
							radiusKm: Array.isArray(next) ? (next[0] ?? minKm) : next,
						})
					}
				/>
				<span className="w-16 shrink-0 text-right text-sm tabular-nums">
					{`${value.radiusKm} km`}
				</span>
			</div>
		</FilterFieldFrame>
	);
}
