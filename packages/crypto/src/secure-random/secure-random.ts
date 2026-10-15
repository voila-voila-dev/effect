import { Context, type Effect } from "effect";

/**
 * Where unpredictable bytes come from. A service rather than a direct
 * `crypto.getRandomValues` call so a test can make a token or a one-time code
 * predictable; `randomToken` and `randomDigitCode` build on it.
 */
export class SecureRandom extends Context.Service<
	SecureRandom,
	{
		readonly bytes: (length: number) => Effect.Effect<Uint8Array<ArrayBuffer>>;
	}
>()("@voila.dev/crypto/SecureRandom") {}
