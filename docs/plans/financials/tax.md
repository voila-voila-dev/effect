# Taxes — `@voila.dev/tax`

**VAT is one kind of tax.** The model has to carry, without special cases:

- EU VAT: standard, reduced and zero rates, exemptions with their legal ground, reverse
  charge, small-business franchises (France's 293 B), margin schemes;
- US sales tax: state, county and city rates stacked on the same line, exempt buyers
  (resale certificates), taxability that depends on the product;
- GST, excise and other per-unit taxes;
- withholding taxes that lower the amount payable but not the total (Spain's IRPF,
  Italy's *ritenuta d'acconto*);
- fixed taxes on the document (Italy's *imposta di bollo*);
- taxes computed on top of other taxes.

## Model

```ts
// What a tax is.
type TaxKind = "vat" | "gst" | "sales-tax" | "excise" | "withholding" | "stamp-duty" | (string & Brand)
type Jurisdiction = { country: CountryCode; subdivision?: SubdivisionCode; locality?: string }
type Rate =
  | { _tag: "Percent"; basisPoints: number }            // 20 %, 8.875 %
  | { _tag: "PerUnit"; amount: Money; unit: UnitCode }   // excise per litre
  | { _tag: "Fixed"; amount: Money }                     // stamp duty per document

type Tax = {
  id: TaxId
  kind: TaxKind
  jurisdiction: Jurisdiction
  rate: Rate
  scope: "line" | "document"                        // per line, or on the document
  base: "net" | { _tag: "Compound"; on: TaxId[] }   // tax on tax
  effect: "add" | "withhold"                        // withholding lowers the amount payable
  category: TaxCategoryCode                         // UNCL5305: S, Z, E, AE, K, G, O…
}

// What happened to a tax on a line or on the document.
type TaxOutcome =
  | { _tag: "Applied"; tax: Tax; base: Money; amount: Money }
  | { _tag: "Exempt"; tax: Tax; reason: ExemptionReason }          // VATEX code + legal text
  | { _tag: "ReverseCharged"; tax: Tax; reason: ExemptionReason }
  | { _tag: "OutOfScope"; reason: ExemptionReason }                // e.g. a VAT franchise
```

`ExemptionReason` carries a code (EN 16931 VATEX where one exists) and the legal mention
in the document's language; the jurisdiction profile supplies the wording.

## Computation (pure, shared)

- **Pricing mode** per document: `exclusive` (B2B, the US) or `inclusive` (EU B2C prices
  shown with tax). Taxes are backed out of inclusive prices.
- **Rounding policy** per jurisdiction: per line, or per tax rate on the document (the
  EN 16931 breakdown). The sum of the lines and the totals never drift by a cent.
- **Totals** in the EN 16931 order: line net amounts → document allowances and charges →
  tax breakdown per (tax, rate, category) → total with tax → withholdings → prepaid
  amount → **amount payable**.
- **Multi-currency**: document currency, and the tax total in the jurisdiction's currency
  when it requires it, with the exchange rate used.

## Determination (pluggable)

```ts
TaxDetermination: (seller, buyer, line, supplyDate, placeOfSupply) → TaxOutcome[]
```

A `Context.Service`. Implementations compose:

- `TaxRule.first(a, b, c)` — the first rule that decides;
- `TaxRule.when(predicate, rule)` — e.g. B2B cross-border inside the EU;
- `TaxRule.apply(taxId)`, `TaxRule.exempt(reason)`, `TaxRule.reverseCharge(reason)`,
  `TaxRule.outOfScope(reason)`.

Each consumer writes its own rule set (its services, its markets, its legal situation)
from these pieces. An external engine (Stripe Tax, Avalara) implements the same service
for US sales tax, as a provider package — when a consumer sells in the US.

## Rates are dated data

`TaxRateCatalogue` answers "what is the rate of this tax, in this jurisdiction, on this
date". Rates change, sometimes mid-year: every rate carries its effective dates, and an
issued document keeps the rate it used.

- `@voila.dev/tax/eu-vat`: the member states' VAT rates as versioned data. Maintaining it
  is a recurring cost (open decision 3 in [`../README.md`](../README.md)).
- An in-memory catalogue for tests and for consumers that keep their own.

## Done when

Two consumers' real tax situations — cross-border services between EU countries with
VAT, and a French micro-enterprise under the franchise — are rule sets on this package,
and the example's US invoice computes stacked sales tax from a catalogue.
