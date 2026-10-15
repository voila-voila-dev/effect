import { DateTime, Duration, Effect, Option, Schema } from "effect";
import { base64UrlFromBytes, bytesFromBase64Url } from "../bytes/base64.ts";
import { constantTimeEquals } from "../bytes/constant-time-equals.ts";
import { textFromUtf8, utf8Bytes } from "../bytes/utf8.ts";
import { InvalidTokenError } from "./invalid-token-error.ts";
import { TokenSigner } from "./token-signer.ts";

/**
 * One kind of signed token: an unsubscribe link, a reply address, a download
 * link, a one-click approval. It carries its payload and its expiry, so there
 * is no token table and no write when one is issued; verifying proves it was
 * issued by this app, for this purpose, and has not expired.
 *
 * The payload is signed, not encrypted: anyone holding the token can read it.
 */
export interface SignedTokenKind<A> {
	readonly purpose: string;
	/** A token expiring after the kind's `lifetime`, or never when it has none. */
	readonly issue: (payload: A) => Effect.Effect<string, never, TokenSigner>;
	/** A token expiring at `expiresAt`, whatever the kind's lifetime. */
	readonly issueUntil: (
		payload: A,
		expiresAt: DateTime.DateTime,
	) => Effect.Effect<string, never, TokenSigner>;
	/** The payload of a genuine, unexpired token of this kind. */
	readonly verify: (
		token: string,
	) => Effect.Effect<A, InvalidTokenError, TokenSigner>;
}

export interface SignedTokenOptions<A, I> {
	/**
	 * What the token is for, signed with it: a token issued for one purpose is
	 * `forged` for any other. Name it like an event (`"newsletter.unsubscribe"`);
	 * renaming it voids every token in circulation.
	 */
	readonly purpose: string;
	/** Encoded to JSON, then base64url: keep it to the ids the verifier needs. */
	readonly payload: Schema.Codec<A, I>;
	/** How long `issue` makes a token last. Without it, `issue` tokens never expire. */
	readonly lifetime?: Duration.Input;
	/**
	 * Bytes of the tag, 16 (128 bits) by default. Fewer only where length is
	 * scarce, such as an email local part (64 characters), and never below 8:
	 * with an expiry and the purpose bound in, 64 bits still cannot be guessed
	 * online.
	 */
	readonly tagBytes?: number;
}

const DEFAULT_TAG_BYTES = 16;

/**
 * Declares a token kind. The token is `<payload>.<tag>`, or
 * `<payload>.<expiry>.<tag>` when it expires, every part URL-safe; the expiry
 * is in epoch seconds, base36. The tag signs the purpose, the payload and the
 * expiry, each on its own line, so no two of them can be shifted into each
 * other.
 */
export function makeSignedToken<A, I>(
	options: SignedTokenOptions<A, I>,
): SignedTokenKind<A> {
	const { purpose } = options;
	const tagBytes = options.tagBytes ?? DEFAULT_TAG_BYTES;
	if (purpose.length === 0 || purpose.includes("\n")) {
		throw new TypeError(
			`a token purpose is one non-empty line, not ${JSON.stringify(purpose)}`,
		);
	}
	if (!Number.isInteger(tagBytes) || tagBytes < 8 || tagBytes > 32) {
		throw new RangeError(`a token tag is 8 to 32 bytes, not ${tagBytes}`);
	}
	const lifetime =
		options.lifetime === undefined
			? undefined
			: Duration.fromInputUnsafe(options.lifetime);
	const json = Schema.fromJsonString(Schema.toCodecJson(options.payload));
	const encodePayload = Schema.encodeSync(json);
	const decodePayload = Schema.decodeUnknownOption(json);

	const refuse = (reason: InvalidTokenError["reason"]) =>
		new InvalidTokenError({ purpose, reason });

	const tagOf = (payload: string, expiry: string) =>
		TokenSigner.use((signer) =>
			signer.sign(`${purpose}\n${payload}\n${expiry}`),
		).pipe(Effect.map((tag) => base64UrlFromBytes(tag.subarray(0, tagBytes))));

	const sign = (payload: A, expiresAt: DateTime.DateTime | undefined) =>
		Effect.gen(function* () {
			// A payload that does not encode is a caller's bug, not a refusal.
			const encoded = base64UrlFromBytes(utf8Bytes(encodePayload(payload)));
			const expiry =
				expiresAt === undefined ? "" : epochSeconds(expiresAt).toString(36);
			const tag = yield* tagOf(encoded, expiry);
			return expiry === ""
				? `${encoded}.${tag}`
				: `${encoded}.${expiry}.${tag}`;
		});

	return {
		purpose,
		issue: (payload) =>
			lifetime === undefined
				? sign(payload, undefined)
				: Effect.flatMap(DateTime.now, (now) =>
						sign(payload, DateTime.addDuration(now, lifetime)),
					),
		issueUntil: sign,
		verify: (token) =>
			Effect.gen(function* () {
				const parts = token.split(".");
				const [payload = "", expiry = "", tag = ""] =
					parts.length === 2 ? [parts[0], "", parts[1]] : parts;
				if (
					parts.length < 2 ||
					parts.length > 3 ||
					payload === "" ||
					tag === "" ||
					(parts.length === 3 && !/^[0-9a-z]+$/u.test(expiry))
				) {
					return yield* refuse("malformed");
				}
				if (!constantTimeEquals(tag, yield* tagOf(payload, expiry))) {
					return yield* refuse("forged");
				}
				if (
					expiry !== "" &&
					Number.parseInt(expiry, 36) <= epochSeconds(yield* DateTime.now)
				) {
					return yield* refuse("expired");
				}
				const bytes = bytesFromBase64Url(payload);
				const decoded =
					bytes === null ? Option.none() : decodeText(bytes, decodePayload);
				if (Option.isNone(decoded)) return yield* refuse("malformed");
				return decoded.value;
			}),
	};
}

function decodeText<A>(
	bytes: Uint8Array,
	decode: (text: string) => Option.Option<A>,
): Option.Option<A> {
	try {
		return decode(textFromUtf8(bytes));
	} catch {
		return Option.none();
	}
}

function epochSeconds(dateTime: DateTime.DateTime): number {
	return Math.floor(DateTime.toEpochMillis(dateTime) / 1000);
}

/** Token kinds under one name: `SignedToken.make({ purpose, payload })`. */
export const SignedToken = { make: makeSignedToken } as const;
