import { retryPolicy } from "./retry-policy.ts";

/** The real backoff shape, at millisecond scale so a test does not sleep. */
export const quickPolicy = (attempts: number) =>
	retryPolicy({ attempts, initialDelay: "1 millis", maximumDelay: "2 millis" });
