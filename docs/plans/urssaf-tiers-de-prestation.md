# URSSAF API Tiers de prestation — `@voila.dev/urssaf-tiers-de-prestation`

In France, household services (*services à la personne*: cleaning, home care, childcare,
tutoring, gardening…) give the client a 50 % tax credit. The **avance immédiate** lets
the client pay only their half at once: the provider declares the service through the
**API Tiers de prestation**, the client validates it, URSSAF collects the client's share
and pays the provider in full.

A provider package in `domains/providers`. It keeps the API's own vocabulary
(*particulier*, *demande de paiement*), as `annuaire-entreprises` keeps the directory's;
nothing in it is specific to one product, and any household-services provider can use it.

## Before any code

Access needs a **habilitation** from URSSAF and an agreement. The delay is outside our
hands and is the longest external wait in these plans: **file it first**.

## Contents

- OAuth2 client credentials, sandbox and production, through `@voila.dev/http`; outages
  typed apart from refusals.
- **Register a client** (*particulier*) and read their registration status.
- **Submit a payment request** (*demande de paiement*) for services rendered; search,
  read and cancel requests.
- **Statuses** as a typed union with URSSAF's codes and reasons (awaiting the client's
  validation, validated, refused, collected, collection failed, paid, cancelled…).
  **Endpoints, payloads and codes come from the official specification**, not from
  memory.
- An **in-memory fake** with a scripted lifecycle, including refusals and failed
  collections, for consumers' tests and local development.

What stays with the consumer: which services are eligible, building requests from its own
data, the monthly calendar, explaining refusals to its users, and a manual fallback when
the API is down or the habilitation is not there yet.

## Done when

A test client is registered and a payment request reaches "paid" in the URSSAF sandbox,
and the fake replays the same lifecycle.
