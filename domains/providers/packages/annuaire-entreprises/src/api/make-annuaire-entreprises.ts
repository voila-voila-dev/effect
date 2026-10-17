import {
	decodeJsonResponse,
	ensureSuccess,
	isRateLimited,
	OutboundStatusError,
	OutboundTimeout,
	OutboundTimeoutError,
	OutboundTransportError,
	outboundCall,
	ResponseDecodeError,
	RetryPolicy,
	retryOutbound,
	sendOutbound,
	withTimeout,
} from "@voila.dev/http";
import { Effect, Layer, Option } from "effect";
import { AnnuaireEntreprises } from "../directory/annuaire-entreprises.ts";
import { AnnuaireEntreprisesUnavailableError } from "../directory/annuaire-entreprises-unavailable-error.ts";
import {
	ACTIVE_STATE,
	holdsEstablishment,
	readEstablishment,
	readHeadOffice,
} from "./read-entreprise.ts";
import { SearchResponse } from "./search-response.ts";

// The public company search: keyless, 7 requests per second, France only.
const SEARCH_ENDPOINT = "https://recherche-entreprises.api.gouv.fr/search";

/** A search answer is a page of companies: a few hundred kilobytes at most. */
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;

export interface AnnuaireEntreprisesOptions {
	/**
	 * The partner the requests go out as, which picks the `fetch` from
	 * `OutboundFetch` and names the span and the request log entry.
	 * `annuaire-entreprises` unless told otherwise.
	 */
	readonly partner?: string;
	/** The backoff for a 5xx, a timeout or a dropped connection; `RetryPolicy.transient` by default. */
	readonly transientRetry?: RetryPolicy;
	/** The backoff for a 429; `RetryPolicy.rateLimited` by default. */
	readonly rateLimitedRetry?: RetryPolicy;
}

function describe(error: unknown): string {
	if (error instanceof OutboundStatusError) {
		return `${error.status}: ${error.body.slice(0, 200)}`;
	}
	if (error instanceof OutboundTimeoutError) {
		return `did not answer within ${error.timeoutMilliseconds}ms`;
	}
	if (error instanceof OutboundTransportError) {
		return `request failed: ${String(error.cause)}`;
	}
	if (error instanceof ResponseDecodeError) {
		return `answer did not decode: ${String(error.cause)}`;
	}
	return String(error);
}

/**
 * The Annuaire des Entreprises over its public search API. Each attempt is
 * bounded by `OutboundTimeout.roundTrip`; a 5xx or a dropped connection is
 * retried briefly and a 429 with a longer backoff. Any other refusal, and an
 * answer that does not decode, fails at once.
 */
export function makeAnnuaireEntreprises(
	options: AnnuaireEntreprisesOptions = {},
): typeof AnnuaireEntreprises.Service {
	const partner = options.partner ?? "annuaire-entreprises";

	const search = (parameters: Readonly<Record<string, string>>) => {
		const url = new URL(SEARCH_ENDPOINT);
		for (const [name, value] of Object.entries(parameters)) {
			url.searchParams.set(name, value);
		}
		return sendOutbound(partner, url, {
			headers: { accept: "application/json" },
		}).pipe(
			Effect.flatMap(ensureSuccess),
			Effect.flatMap(
				decodeJsonResponse(SearchResponse, { maxBytes: MAX_RESPONSE_BYTES }),
			),
			withTimeout(OutboundTimeout.roundTrip),
			retryOutbound(options.transientRetry ?? RetryPolicy.transient),
			retryOutbound(options.rateLimitedRetry ?? RetryPolicy.rateLimited, {
				when: isRateLimited,
			}),
			Effect.mapError(
				(error) =>
					new AnnuaireEntreprisesUnavailableError({
						message: `Annuaire des Entreprises ${describe(error)}`,
					}),
			),
			outboundCall({
				partner,
				operation: "search",
				attributes: { "business.country": "FR" },
			}),
		);
	};

	return {
		findBySiret: (siret) =>
			search({ q: siret }).pipe(
				Effect.map((response) =>
					Option.fromNullishOr(
						response.results.find((entreprise) =>
							holdsEstablishment(entreprise, siret),
						),
					).pipe(
						Option.map((entreprise) => readEstablishment(entreprise, siret)),
					),
				),
			),
		searchByName: ({ query, postalCode, limit }) =>
			search({
				q: query,
				etat_administratif: ACTIVE_STATE,
				per_page: String(limit),
				...(postalCode === undefined ? {} : { code_postal: postalCode }),
			}).pipe(
				Effect.map((response) => response.results.flatMap(readHeadOffice)),
			),
	};
}

/** {@link makeAnnuaireEntreprises} as the {@link AnnuaireEntreprises} layer. */
export function annuaireEntreprisesLayer(
	options: AnnuaireEntreprisesOptions = {},
): Layer.Layer<AnnuaireEntreprises> {
	return Layer.succeed(AnnuaireEntreprises, makeAnnuaireEntreprises(options));
}
