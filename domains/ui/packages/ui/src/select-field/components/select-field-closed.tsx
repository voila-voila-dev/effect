import { cn } from "#/lib/utils.ts";
import { ResponsiveSelect } from "#/responsive-select/components/responsive-select.tsx";
import { TRIGGER_HEIGHTS } from "#/select-field/lib/select-field-heights.ts";
import type { SelectFieldProps } from "#/select-field/lib/select-field-props.ts";

/**
 * The sentinel behind `nullOption`: the underlying select reads the empty
 * value as "nothing selected", so an explicit "none"/"all" row cannot use it.
 */
const NULL_OPTION_VALUE = "__select-field-null__";

interface Props extends SelectFieldProps {}

/** The plain select: a closed list, opened from a trigger. */
export function SelectFieldClosed({
	options,
	value,
	onValueChange,
	placeholder,
	nullOption,
	disabled = false,
	size = "default",
	invalid = false,
	id,
	testId,
	name,
	className,
	onBlur,
	isBlurIntoOwnPopup,
}: Props) {
	const unselected = nullOption === undefined ? "" : NULL_OPTION_VALUE;

	return (
		<ResponsiveSelect.Root
			name={name}
			value={value ?? unselected}
			disabled={disabled}
			onValueChange={(next) => {
				// The empty value is the placeholder, never a choice.
				if (next === "" || next === null) return;
				onValueChange(next === NULL_OPTION_VALUE ? null : next);
			}}
		>
			<ResponsiveSelect.Trigger
				id={id}
				data-slot="select-field"
				data-testid={testId}
				// The kit's trigger stops at `default`, so `lg` takes its height as a
				// class rather than as a size.
				size={size === "lg" ? "default" : size}
				onBlur={(event) => {
					if (isBlurIntoOwnPopup?.(event) === true) return;
					onBlur?.(event);
				}}
				aria-invalid={invalid}
				className={cn(
					"w-full",
					size === "lg" ? TRIGGER_HEIGHTS.lg : undefined,
					className,
				)}
			>
				<ResponsiveSelect.Value placeholder={placeholder} />
			</ResponsiveSelect.Trigger>
			<ResponsiveSelect.Content>
				{nullOption !== undefined && (
					<ResponsiveSelect.Item value={NULL_OPTION_VALUE}>
						{nullOption.label}
					</ResponsiveSelect.Item>
				)}
				{options.map((option) => (
					<ResponsiveSelect.Item key={option.value} value={option.value}>
						{option.label}
					</ResponsiveSelect.Item>
				))}
			</ResponsiveSelect.Content>
		</ResponsiveSelect.Root>
	);
}
