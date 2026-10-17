import { Context } from "effect";

export interface InboundEmailSettingsShape {
	/**
	 * The domains the application sends and receives on. A message from one
	 * of them is the application answering itself, and is refused as a loop.
	 */
	readonly ownDomains: ReadonlyArray<string>;
}

/** The inbound side's configuration, empty by default. */
export const InboundEmailSettings =
	Context.Reference<InboundEmailSettingsShape>(
		"@voila.dev/email/InboundEmailSettings",
		{ defaultValue: () => ({ ownDomains: [] }) },
	);
