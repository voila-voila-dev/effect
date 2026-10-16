import { Clock, Context, Effect } from "effect";

export interface MessageIdsShape {
	readonly next: Effect.Effect<string>;
}

function hex(bytes: Uint8Array): string {
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
		"",
	);
}

/**
 * A UUIDv7: the time comes first, so ids land at the end of the primary-key
 * index instead of all over it, and from the `Clock`, so a `TestClock` orders
 * them too.
 */
export function uuidV7(millis: number): string {
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);
	let time = millis;
	for (let index = 5; index >= 0; index -= 1) {
		bytes[index] = time % 256;
		time = Math.floor(time / 256);
	}
	bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x70;
	bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
	const digits = hex(bytes);
	return [
		digits.slice(0, 8),
		digits.slice(8, 12),
		digits.slice(12, 16),
		digits.slice(16, 20),
		digits.slice(20),
	].join("-");
}

/**
 * Where a published message's id comes from. A reference with a UUIDv7
 * default, so nothing has to provide it; a test or an application with its
 * own id scheme replaces it with `Effect.provideService(MessageIds, …)`.
 */
export const MessageIds = Context.Reference<MessageIdsShape>(
	"@voila.dev/outbox/MessageIds",
	{
		defaultValue: () => ({ next: Effect.map(Clock.currentTimeMillis, uuidV7) }),
	},
);
