import { Context, type Effect } from "effect";

/**
 * The key behind every signed token: it signs the token's content and returns
 * the tag. Verifying recomputes the tag, so the signer never sees a presented
 * token and an implementation holds nothing but its key.
 *
 * One signer serves every token kind of an app: the kind's purpose is part of
 * what is signed, so a token of one kind never verifies as another. Provide a
 * second signer around one kind only when it must be revocable on its own.
 */
export class TokenSigner extends Context.Service<
	TokenSigner,
	{
		readonly sign: (content: string) => Effect.Effect<Uint8Array<ArrayBuffer>>;
	}
>()("@voila.dev/crypto/TokenSigner") {}
