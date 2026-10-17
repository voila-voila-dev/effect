import { Effect, Layer } from "effect";
import { TestClock } from "effect/testing";
import { EmailOperator, EmailSystem } from "./access/email-actor.ts";
import type { EmailPermission } from "./access/email-permission.ts";
import { inMemoryEmailLogRepository } from "./delivery/adapters/in-memory-email-log-repository.ts";
import { EmailIds } from "./ids/email-ids.ts";
import { EmailAddress } from "./message/value-objects/email-address.ts";
import type { EmailMessage } from "./message/value-objects/email-message.ts";
import { inMemoryEmailSender } from "./sending/adapters/in-memory-email-sender.ts";
import { inMemorySuppressionList } from "./suppression/adapters/in-memory-suppression-list.ts";

export const systemActor = new EmailSystem({});

export function operator(...permissions: ReadonlyArray<EmailPermission>) {
	return new EmailOperator({ operatorId: "op-1", permissions });
}

export function message(to = "marie@example.fr"): EmailMessage {
	return {
		from: "Example <hello@example.com>",
		to: [EmailAddress.make(to)],
		subject: "Votre code",
		text: "123456",
	};
}

/**
 * The email domain on its in-memory adapters, a `TestClock` at the epoch and
 * ids `id-1`, `id-2`… in order. `run` provides all of it to a program.
 */
export function emailDomain() {
	const sender = inMemoryEmailSender();
	const logs = inMemoryEmailLogRepository();
	const suppressions = inMemorySuppressionList();
	let count = 0;
	const ids = { next: Effect.sync(() => `id-${++count}`) };

	const layer = Layer.mergeAll(
		sender.layer,
		logs.layer,
		suppressions.layer,
		TestClock.layer(),
	);

	function run<A, E>(
		program: Effect.Effect<A, E, Layer.Success<typeof layer>>,
	) {
		return Effect.runPromise(
			program.pipe(Effect.provideService(EmailIds, ids), Effect.provide(layer)),
		);
	}

	return { sender, logs, suppressions, run };
}
