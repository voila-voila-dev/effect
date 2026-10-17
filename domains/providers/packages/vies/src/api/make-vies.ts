import {
	decodeJsonResponse,
	OutboundTimeout,
	OutboundTimeoutError,
	outboundCall,
	ResponseDecodeError,
	RetryPolicy,
	retryOutbound,
	sendOutbound,
	withTimeout,
} from "@voila.dev/http";
import { Effect, Layer, Option } from "effect";
import { Vies } from "../registry/vies.ts";
import { vatPrefixOf } from "../registry/vies-country-code.ts";
import { ViesRejectedInputError } from "../registry/vies-rejected-input-error.ts";
import { ViesUnavailableError } from "../registry/vies-unavailable-error.ts";
import { ViesVatNumberCheck } from "../registry/vies-vat-number-check.ts";
import {
	CheckVatNumberAnswer,
	type FailureAnswer,
} from "./check-vat-number-answer.ts";

// The Commission's public REST endpoint: keyless, rate-limited per member state.
const CHECK_VAT_NUMBER_ENDPOINT =
	"https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number";

/** One check is a few hundred bytes; anything far larger is not an answer. */
const MAX_RESPONSE_BYTES = 64 * 1024;

/** What VIES prints in place of a field the member state does not publish. */
const WITHHELD_MARKER = "---";

/** The codes of a member state or the EU service being down or saturated, which a later attempt may get past. */
const RETRYABLE_ERROR_CODES: ReadonlySet<string> = new Set([
	"MS_UNAVAILABLE",
	"MS_MAX_CONCURRENT_REQ",
	"GLOBAL_MAX_CONCURRENT_REQ",
	"SERVICE_UNAVAILABLE",
	"TIMEOUT",
]);

export interface ViesOptions {
	/**
	 * The partner the requests go out as, which picks the `fetch` from
	 * `OutboundFetch` and names the span and the request log entry. `vies`
	 * unless told otherwise.
	 */
	readonly partner?: string;
	/** The backoff once VIES is unavailable; `RetryPolicy.transient` by default. */
	readonly retry?: RetryPolicy;
}

function published(value: string | null): Option.Option<string> {
	return Option.fromNullishOr(value).pipe(
		Option.map((text) => text.trim()),
		Option.filter((text) => text !== "" && text !== WITHHELD_MARKER),
	);
}

function failureOf(
	status: number,
	answer: FailureAnswer,
): ViesUnavailableError | ViesRejectedInputError {
	const [first] = answer.errorWrappers;
	const code = first?.error ?? "UNKNOWN";
	const message = [`VIES ${status} ${code}`, first?.message]
		.filter((part) => part !== undefined)
		.join(": ");
	return RETRYABLE_ERROR_CODES.has(code) || status >= 500
		? new ViesUnavailableError({ message })
		: new ViesRejectedInputError({ code, message });
}

function unreachable(
	error: OutboundTimeoutError | { readonly cause: unknown },
): ViesUnavailableError {
	return new ViesUnavailableError({
		message:
			error instanceof OutboundTimeoutError
				? `VIES did not answer within ${error.timeoutMilliseconds}ms`
				: `VIES request failed: ${String(error.cause)}`,
	});
}

/**
 * VIES over the Commission's REST endpoint. A member state that is down or
 * saturated, a 5xx, a timeout and an unreadable answer are
 * {@link ViesUnavailableError} and retried; VIES refusing the input itself is
 * {@link ViesRejectedInputError} and is not.
 */
export function makeVies(options: ViesOptions = {}): typeof Vies.Service {
	const partner = options.partner ?? "vies";
	const decode = decodeJsonResponse(CheckVatNumberAnswer, {
		maxBytes: MAX_RESPONSE_BYTES,
	});

	return {
		checkVatNumber: ({ countryCode, vatNumber }) =>
			sendOutbound(partner, CHECK_VAT_NUMBER_ENDPOINT, {
				method: "POST",
				headers: {
					accept: "application/json",
					"content-type": "application/json",
				},
				body: JSON.stringify({
					countryCode: vatPrefixOf(countryCode),
					vatNumber,
				}),
			}).pipe(
				Effect.flatMap((response) =>
					decode(response).pipe(
						Effect.map((answer) => ({ status: response.status, answer })),
						Effect.mapError(
							(error) =>
								new ViesUnavailableError({
									message:
										error instanceof ResponseDecodeError
											? `VIES ${response.status} answer did not decode: ${String(error.cause)}`
											: `VIES ${response.status} answered more than ${error.maxBytes} bytes`,
								}),
						),
					),
				),
				withTimeout(OutboundTimeout.roundTrip),
				Effect.catchTags({
					OutboundTransportError: (error) => Effect.fail(unreachable(error)),
					OutboundTimeoutError: (error) => Effect.fail(unreachable(error)),
				}),
				Effect.flatMap(({ status, answer }) =>
					"actionSucceed" in answer
						? Effect.fail(failureOf(status, answer))
						: Effect.succeed(
								ViesVatNumberCheck.make({
									countryCode,
									vatNumber,
									valid: answer.valid,
									name: published(answer.name),
									address: published(answer.address),
									requestDate: answer.requestDate,
								}),
							),
				),
				retryOutbound(options.retry ?? RetryPolicy.transient, {
					when: (error) => error instanceof ViesUnavailableError,
				}),
				outboundCall({
					partner,
					operation: "check-vat-number",
					attributes: { "business.country": countryCode },
				}),
			),
	};
}

/** {@link makeVies} as the {@link Vies} layer. */
export function viesLayer(options: ViesOptions = {}): Layer.Layer<Vies> {
	return Layer.succeed(Vies, makeVies(options));
}
