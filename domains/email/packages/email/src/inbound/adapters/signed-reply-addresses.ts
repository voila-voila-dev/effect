import { makeSignedToken, TokenSigner } from "@voila.dev/crypto";
import { Effect, Layer, Schema } from "effect";
import { EmailAddress } from "../../message/value-objects/email-address.ts";
import { InvalidReplyTokenError } from "../errors/invalid-reply-token-error.ts";
import { ReplyAddresses } from "../services/reply-addresses.ts";

/** A mail server may refuse a longer local part (RFC 5321). */
const MAX_LOCAL_PART = 64;

const PREFIX = "r.";

const replyToken = makeSignedToken({
	purpose: "email.reply-address",
	payload: Schema.String,
	// The local part has 64 characters; with the expiry and the purpose signed
	// in, 64 bits of tag still cannot be guessed online.
	tagBytes: 8,
});

/**
 * {@link ReplyAddresses} as `r.<payload>.<expiry>.<tag>@<domain>`, signed with
 * the {@link TokenSigner} of `@voila.dev/crypto`. The payload is encoded in
 * the token, so keep it to a short id: minting dies when the address would
 * pass 64 characters before the `@`, which a payload of about 25 characters
 * stays under.
 */
export function signedReplyAddresses(options: {
	/** The domain the provider receives replies on, `reply.example.com`. */
	readonly domain: string;
}): Layer.Layer<ReplyAddresses, never, TokenSigner> {
	return Layer.effect(
		ReplyAddresses,
		Effect.map(TokenSigner, (signer) => ({
			mint: (binding) =>
				replyToken.issueUntil(binding.payload, binding.expiresAt).pipe(
					Effect.provideService(TokenSigner, signer),
					Effect.flatMap((token) => {
						const localPart = `${PREFIX}${token}`;
						return localPart.length > MAX_LOCAL_PART
							? Effect.die(
									new RangeError(
										`a reply address payload of ${binding.payload.length} characters does not fit a local part`,
									),
								)
							: Effect.succeed(
									EmailAddress.make(`${localPart}@${options.domain}`),
								);
					}),
				),
			verify: (localPart) =>
				localPart.startsWith(PREFIX)
					? replyToken.verify(localPart.slice(PREFIX.length)).pipe(
							Effect.provideService(TokenSigner, signer),
							Effect.mapError(() => new InvalidReplyTokenError()),
						)
					: Effect.fail(new InvalidReplyTokenError()),
		})),
	);
}
