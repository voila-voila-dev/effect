import { useEffect, useRef, useState } from "react";

const CONFIRMATION_MS = 1600;

/**
 * Copies text and flags success for a moment. Takes a promise of the text so a
 * lazily loaded source still copies inside the click: Safari drops the
 * clipboard permission once the gesture's task ends.
 */
export function useCopy(): {
	copied: boolean;
	copy: (text: string | Promise<string>) => Promise<void>;
} {
	const [copied, setCopied] = useState(false);
	const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

	useEffect(() => () => clearTimeout(timer.current), []);

	async function copy(text: string | Promise<string>): Promise<void> {
		const item = new ClipboardItem({
			"text/plain": Promise.resolve(text).then(
				(value) => new Blob([value], { type: "text/plain" }),
			),
		});
		await navigator.clipboard.write([item]);
		setCopied(true);
		clearTimeout(timer.current);
		timer.current = setTimeout(() => setCopied(false), CONFIRMATION_MS);
	}

	return { copied, copy };
}
