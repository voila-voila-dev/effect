import { Config, Redacted } from "effect";
import { hmacTokenSigner } from "./hmac-token-signer.ts";

export const TEST_SECRET = "a test secret of at least thirty-two bytes";

export function signerWith(secret: string = TEST_SECRET) {
	return hmacTokenSigner(Config.succeed(Redacted.make(secret)));
}
