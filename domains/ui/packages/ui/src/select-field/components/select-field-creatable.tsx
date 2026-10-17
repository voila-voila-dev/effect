import { PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Combobox } from "#/combobox/components/combobox.tsx";
import { cn } from "#/lib/utils.ts";
import { COMBOBOX_HEIGHTS } from "#/select-field/lib/select-field-heights.ts";
import type { SelectFieldOption } from "#/select-field/lib/select-field-option.ts";
import type { SelectFieldProps } from "#/select-field/lib/select-field-props.ts";
import {
	CREATE_VALUE,
	visibleItems,
} from "#/select-field/lib/visible-items.ts";
import { Spinner } from "#/spinner/components/spinner.tsx";

interface Props extends SelectFieldProps {}

function defaultCreateLabel(query: string): string {
	return `Create "${query}"`;
}

/** The selected option resolved back to a row, gone when the value is unset. */
function selectedOption(
	options: ReadonlyArray<SelectFieldOption>,
	value: string | null,
): SelectFieldOption | null {
	if (value === null) return null;
	return options.find((option) => option.value === value) ?? null;
}

/** The empty slot: a spinner while the options travel, the hint once settled. */
function EmptySlot({
	loading,
	emptyHint,
}: {
	readonly loading: boolean;
	readonly emptyHint: string | undefined;
}) {
	if (loading) {
		return (
			<Combobox.Empty>
				<Spinner className="size-4" />
			</Combobox.Empty>
		);
	}
	if (emptyHint === undefined) return null;
	return (
		<Combobox.Empty className="px-3 text-start">{emptyHint}</Combobox.Empty>
	);
}

/**
 * The same select, once it can also be typed into: a combobox styled as the
 * trigger it replaces, with the create offer as one more row at the end.
 */
export function SelectFieldCreatable({
	options,
	value,
	onValueChange,
	onCreate,
	createLabel = defaultCreateLabel,
	emptyHint,
	loading = false,
	searchValue,
	onSearchChange,
	placeholder,
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
	const [ownQuery, setOwnQuery] = useState("");
	const query = searchValue ?? ownQuery;
	function setQuery(next: string): void {
		setOwnQuery(next);
		onSearchChange?.(next);
	}

	const typed = query.trim();
	const items = visibleItems({
		options,
		typed,
		narrowedByCaller: onSearchChange !== undefined,
		createLabel,
	});

	function take(next: SelectFieldOption | null): void {
		if (next === null) return;
		setQuery("");
		if (next.value === CREATE_VALUE) {
			onCreate?.(typed);
			return;
		}
		onValueChange(next.value);
	}

	return (
		<Combobox.Root
			// `items` is already exactly what should show — see `visibleItems`.
			filter={() => true}
			items={items}
			value={selectedOption(options, value)}
			inputValue={query}
			onInputValueChange={setQuery}
			onValueChange={take}
			disabled={disabled}
			name={name}
			itemToStringLabel={(option: SelectFieldOption) => option.label}
			itemToStringValue={(option: SelectFieldOption) => option.value}
			isItemEqualToValue={(
				option: SelectFieldOption,
				current: SelectFieldOption,
			) => option.value === current.value}
		>
			<Combobox.Input
				id={id}
				data-slot="select-field"
				data-testid={testId}
				autoComplete="off"
				placeholder={placeholder}
				aria-invalid={invalid}
				onBlur={(event) => {
					if (isBlurIntoOwnPopup?.(event) === true) return;
					onBlur?.(event);
				}}
				className={cn(COMBOBOX_HEIGHTS[size], "w-full", className)}
			/>
			<Combobox.Content
				// A popup with nothing to say stays invisible rather than opening as
				// a bare bordered box under the field.
				className={
					emptyHint === undefined && !loading ? "data-empty:hidden" : undefined
				}
			>
				<Combobox.List>
					{items.map((option) => (
						<Combobox.Item key={option.value} value={option}>
							{option.value === CREATE_VALUE ? (
								<span className="flex items-center gap-1.5">
									<PlusIcon className="size-4 shrink-0" />
									{option.label}
								</span>
							) : (
								option.label
							)}
						</Combobox.Item>
					))}
				</Combobox.List>
				<EmptySlot loading={loading} emptyHint={emptyHint} />
			</Combobox.Content>
		</Combobox.Root>
	);
}
