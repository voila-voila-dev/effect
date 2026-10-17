import type { EmailMessage } from "@voila.dev/email";

/** Resend's batch endpoint takes at most this many messages per call. */
export const MAX_BATCH_SIZE = 100;

export type SendStep =
	| { readonly kind: "batch"; readonly messages: ReadonlyArray<EmailMessage> }
	| { readonly kind: "single"; readonly message: EmailMessage };

/**
 * The calls that send `messages` in order: runs of messages without
 * attachments go through the batch endpoint, at most {@link MAX_BATCH_SIZE}
 * at a time; a message with attachments goes alone, since the batch endpoint
 * does not take them.
 */
export function sendPlan(
	messages: ReadonlyArray<EmailMessage>,
): ReadonlyArray<SendStep> {
	const steps: Array<SendStep> = [];
	let run: Array<EmailMessage> = [];
	const closeRun = () => {
		if (run.length > 0) steps.push({ kind: "batch", messages: run });
		run = [];
	};
	for (const message of messages) {
		if (message.attachments?.length) {
			closeRun();
			steps.push({ kind: "single", message });
		} else {
			run.push(message);
			if (run.length === MAX_BATCH_SIZE) closeRun();
		}
	}
	closeRun();
	return steps;
}
