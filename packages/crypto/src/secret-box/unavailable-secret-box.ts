import { Effect, Layer } from "effect";
import { SecretBox } from "./secret-box.ts";
import { SecretBoxError } from "./secret-box-error.ts";

const missing = new SecretBoxError({ reason: "missing-key" });

/**
 * A secret box with no key: every seal and open fails `missing-key`. For a
 * deployment where secrets are an optional feature, so the rest of the app
 * keeps running and only the features that need one report it. Pick it over
 * `aesGcmSecretBox` when the key is absent:
 *
 * ```ts
 * Layer.unwrap(Effect.map(Config.option(key), Option.match({
 *   onNone: () => unavailableSecretBox,
 *   onSome: (value) => aesGcmSecretBox(Config.succeed(value)),
 * })))
 * ```
 */
export const unavailableSecretBox = Layer.succeed(SecretBox, {
	seal: () => Effect.fail(missing),
	open: () => Effect.fail(missing),
});
