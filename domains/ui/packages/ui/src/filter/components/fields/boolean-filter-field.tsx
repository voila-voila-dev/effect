import { FilterFieldFrame } from "#/filter/components/fields/filter-field-frame.tsx";
import { OptionToggle } from "#/filter/components/fields/option-toggle.tsx";
import type {
	BooleanFilterDefinition,
	BooleanFilterValue,
} from "#/filter/types.ts";

interface Props {
	definition: BooleanFilterDefinition;
	value: BooleanFilterValue | undefined;
	onValueChange: (value: BooleanFilterValue | undefined) => void;
}

/**
 * Yes and no as two option pills — the same control as a single-choice select,
 * so a screenful of mixed filters reads as one thing. The third state ("any")
 * is the empty selection: tapping the active pill releases it, and the frame's
 * clear action does the same, which is how every other field says "unset". A
 * switch would have no third state and silently turn "I don't care" into
 * "must be false".
 */
export function BooleanFilterField({
	definition,
	value,
	onValueChange,
}: Props) {
	const states: ReadonlyArray<{ label: string; state: boolean }> = [
		{ label: definition.trueLabel, state: true },
		{ label: definition.falseLabel, state: false },
	];

	return (
		<FilterFieldFrame
			label={definition.label}
			description={definition.description}
			onClear={value === undefined ? undefined : () => onValueChange(undefined)}
		>
			<div
				role="listbox"
				aria-label={definition.label}
				className="flex flex-wrap gap-2"
			>
				{states.map(({ label, state }) => {
					const selected = value?.value === state;
					return (
						<OptionToggle
							key={String(state)}
							option={{ value: String(state), label }}
							selected={selected}
							onToggle={() =>
								onValueChange(
									selected ? undefined : { kind: "boolean", value: state },
								)
							}
						/>
					);
				})}
			</div>
		</FilterFieldFrame>
	);
}
