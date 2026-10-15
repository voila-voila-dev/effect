import { Context, type Effect } from "effect";
import type { SecretBoxError } from "./secret-box-error.ts";

/**
 * Encrypts a secret before it is stored and decrypts it where it is used, so
 * the database and its backups never hold the value in clear (a customer's
 * API key, an OAuth refresh token).
 *
 * `boundTo` names what the value belongs to, usually the id of the row that
 * stores it: a sealed text copied onto another row does not open there.
 */
export class SecretBox extends Context.Service<
	SecretBox,
	{
		readonly seal: (
			plaintext: string,
			boundTo: string,
		) => Effect.Effect<string, SecretBoxError>;
		readonly open: (
			sealed: string,
			boundTo: string,
		) => Effect.Effect<string, SecretBoxError>;
	}
>()("@voila.dev/crypto/SecretBox") {}
