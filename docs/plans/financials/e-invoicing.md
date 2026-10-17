# E-invoicing — `@voila.dev/e-invoicing`

European countries are making structured e-invoices mandatory, each through its own
network. One contract, one package per network.

## The mandates (to re-verify against official sources before shipping)

| Country | Network | Status |
|---|---|---|
| France | *Plateformes agréées* (ex-PDP), public directory and concentrator | Receiving for every business and issuing for large and mid-size ones from 1 Sept 2026; issuing and **e-reporting** for SMEs and micro-enterprises from **1 Sept 2027** |
| Italy | SDI | In force (B2B and B2C) |
| Poland | KSeF | Phasing in from 2026 |
| Belgium | Peppol | B2B from 2026 |
| Germany | Free choice, XRechnung / ZUGFeRD | Receiving now, issuing 2027–2028 |
| Spain | Verifactu, then B2B e-invoicing | Phasing in |

France matters first: both first consumers are French businesses.

**E-reporting** is the French obligation for transactions that are not B2B e-invoices
(B2C sales, international sales): the transaction data, then the payment data for
services, go to the administration through the same plateforme agréée.

## Formats (pure)

From an `Invoice` to the EN 16931 semantic model, then to:

- `/factur-x` — CII XML embedded in a PDF/A-3 (identical to ZUGFeRD);
- `/xrechnung` — the German CIUS;
- `/ubl` — UBL 2.1 and Peppol BIS Billing 3.0;
- later `/fatturapa`, `/ksef` when a consumer needs them.

Tested against the official schematrons and the published sample files. The formats work
on any invoice mapped to the model, not only ones issued by `invoicing`.

## The `EInvoicingNetwork` contract

- `registerCompany` — onboard a company with the network, on its behalf, and in the
  directory where there is one;
- `transmit` — send a B2B invoice in the network's format; returns a tracking id;
- `report` — e-reporting of transactions and payments;
- `lifecycle` — statuses (deposited, rejected, refused, approved, paid…) as events through
  a verified webhook, parsed into one typed union across networks;
- `receive` — incoming invoices, mapped back to the model;
- `lookupDirectory` — a buyer's routing address from its identifier.

A network that lacks a capability says so in its type, not at runtime.

## Providers

One package each in `domains/providers`: the first French plateforme agréée (choice
criteria: onboarding companies by API on their behalf, B2C e-reporting, price per
company, sandbox), then a Peppol access point, then SDI and KSeF when needed. An
accounting tool's API and its plateforme agréée API are different products: they are
different packages even from the same vendor.

## Done when

An invoice from the example is reported (B2C) and another transmitted (B2B) through the
first plateforme agréée's sandbox, their statuses come back through the webhook, and a
received invoice is read back into the model.
