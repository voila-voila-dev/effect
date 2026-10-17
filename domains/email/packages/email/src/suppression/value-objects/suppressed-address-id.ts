import { Schema } from "effect";

export const SuppressedAddressId = Schema.String.pipe(
	Schema.brand("SuppressedAddressId"),
);

export type SuppressedAddressId = typeof SuppressedAddressId.Type;
