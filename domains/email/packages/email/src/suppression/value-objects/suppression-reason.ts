import { Schema } from "effect";

/**
 * Why an address may never be mailed again. Stored rather than derived,
 * because releasing it is a judgement call: lifting a hard bounce after a
 * corrected typo is routine, lifting a complaint is mailing someone who
 * reported you for spam.
 */
export const SUPPRESSION_REASONS = [
	/** The address does not exist. */
	"HardBounce",
	/** The recipient reported a message as spam. */
	"Complaint",
	/** Temporary failures, repeated with no delivery in between. */
	"RepeatedSoftBounce",
	/** An operator blocked it by hand. */
	"ManualBlock",
] as const;

export const SuppressionReason = Schema.Literals(SUPPRESSION_REASONS);

export type SuppressionReason = typeof SuppressionReason.Type;

/**
 * The reasons the recipient gave rather than us, which also count as an
 * opt-out from marketing: a complaint is an unsubscribe said rudely.
 */
export const OPT_OUT_SUPPRESSION_REASONS: ReadonlyArray<SuppressionReason> = [
	"Complaint",
];
