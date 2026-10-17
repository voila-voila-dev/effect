import { useEffect, useRef, useState } from "react";
import { setFilterValue } from "#/filter/lib/filter-values.ts";
import type {
	FilterDefinition,
	FilterKind,
	FilterValue,
	FilterValues,
} from "#/filter/types.ts";

/**
 * Typing pauses, everything else lands at once: a select applies on tap, but a
 * half-typed text or number bound would refetch the list on every keystroke.
 */
const DEBOUNCED_KINDS: ReadonlySet<FilterKind> = new Set([
	"text",
	"number",
	"numberRange",
	"moneyRange",
]);

/** How long a typed edit waits before it reaches `onValuesChange`. */
export const LIVE_COMMIT_DEBOUNCE_MS = 300;

/**
 * The state behind a live-applying editor (`Filter.Sheet`, `Filter.Dock`):
 * every edit shows at once in the fields, and reaches `onValuesChange` at once
 * for a discrete kind or after a pause for a typed one. Values applied
 * elsewhere (a chip removed beside the editor) flow back in, but never over an
 * edit still waiting on its pause.
 */
export function useLiveFilterValues(
	values: FilterValues,
	onValuesChange: (values: FilterValues) => void,
): {
	/** What the fields show: the applied record plus any pending typed edit. */
	draft: FilterValues;
	/** Sets one filter, committing it now or after the typing pause. */
	change: (
		definition: FilterDefinition,
		value: FilterValue | undefined,
	) => void;
	/** Empties the record and commits that at once, dropping a pending edit. */
	clearAll: () => void;
} {
	const [draft, setDraft] = useState<FilterValues>(values);
	const draftRef = useRef(draft);
	const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (commitTimer.current === null) {
			draftRef.current = values;
			setDraft(values);
		}
	}, [values]);

	// An edit pending when the editor unmounts has no owner left to commit to;
	// dropping it costs at most one debounce window of typing.
	useEffect(
		() => () => {
			if (commitTimer.current !== null) {
				clearTimeout(commitTimer.current);
			}
		},
		[],
	);

	function cancelPending() {
		if (commitTimer.current !== null) {
			clearTimeout(commitTimer.current);
			commitTimer.current = null;
		}
	}

	function change(
		definition: FilterDefinition,
		value: FilterValue | undefined,
	) {
		const next = setFilterValue(draftRef.current, definition.key, value);
		draftRef.current = next;
		setDraft(next);
		cancelPending();
		if (DEBOUNCED_KINDS.has(definition.kind)) {
			commitTimer.current = setTimeout(() => {
				commitTimer.current = null;
				onValuesChange(draftRef.current);
			}, LIVE_COMMIT_DEBOUNCE_MS);
		} else {
			onValuesChange(next);
		}
	}

	function clearAll() {
		cancelPending();
		draftRef.current = {};
		setDraft({});
		onValuesChange({});
	}

	return { draft, change, clearAll };
}
