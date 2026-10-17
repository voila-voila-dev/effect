import { describe, expect, it } from "bun:test";
import { Effect } from "effect";
import { TestClock } from "effect/testing";
import { emailDomain, operator } from "../../email-domain.test-helper.ts";
import { ReleaseSuppressedAddressUseCase } from "./release-suppressed-address-use-case.ts";
import { SearchSuppressedAddressesUseCase } from "./search-suppressed-addresses-use-case.ts";
import { SuppressAddressUseCase } from "./suppress-address-use-case.ts";

const manager = operator("email.suppression.manage");

function block(email: string) {
	return SuppressAddressUseCase.execute({
		actor: manager,
		payload: { email, note: "asked by phone" },
	});
}

describe("the suppression list, by hand", () => {
	it("blocks an address normalized, as ManualBlock", async () => {
		const domain = emailDomain();
		const entry = await domain.run(block("  Marie@Example.FR "));
		expect(entry).toMatchObject({
			email: "marie@example.fr",
			reason: "ManualBlock",
			note: "asked by phone",
		});
	});

	it("reconfirms a second block without resetting when it started", async () => {
		const domain = emailDomain();
		const [first, second] = await domain.run(
			Effect.gen(function* () {
				const opened = yield* block("marie@example.fr");
				yield* TestClock.adjust("1 day");
				return [opened, yield* block("marie@example.fr")] as const;
			}),
		);
		expect(second.id).toBe(first.id);
		expect(second.firstSuppressedAt).toEqual(first.firstSuppressedAt);
		expect(second.lastConfirmedAt).not.toEqual(first.lastConfirmedAt);
	});

	it("releases an address, and releasing it again does nothing", async () => {
		const domain = emailDomain();
		await domain.run(
			Effect.gen(function* () {
				yield* block("marie@example.fr");
				for (let time = 0; time < 2; time += 1) {
					yield* ReleaseSuppressedAddressUseCase.execute({
						actor: manager,
						payload: { email: "MARIE@example.fr" },
					});
				}
			}),
		);
		expect(domain.suppressions.addresses.size).toBe(0);
	});

	it("searches by a part of the address", async () => {
		const domain = emailDomain();
		const page = await domain.run(
			Effect.gen(function* () {
				yield* block("marie@example.fr");
				yield* block("paul@example.fr");
				return yield* SearchSuppressedAddressesUseCase.execute({
					actor: manager,
					payload: { query: "paul", page: { limit: 10, offset: 0 } },
				});
			}),
		);
		expect(page.items.map((entry) => entry.email)).toEqual(["paul@example.fr"]);
	});
});
