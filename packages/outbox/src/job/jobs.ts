import type { Job } from "./job.ts";

export interface Jobs<R> {
	readonly all: ReadonlyArray<Job<unknown, R>>;
	readonly byName: (name: string) => Job<unknown, R> | undefined;
}

/**
 * The services a job list needs, as one union. Read off each job rather than
 * inferred from the array: `R` is covariant, so a plain `Job<unknown, R>[]`
 * parameter makes TypeScript pick one job's services for all of them.
 */
export type JobContextOf<J> = J extends Job<unknown, infer R> ? R : never;

export const Jobs = {
	/** Refuses duplicate names at construction — the registry is its own wiring test. */
	of: <const T extends ReadonlyArray<Job<unknown, unknown>>>(
		jobs: T,
	): Jobs<JobContextOf<T[number]>> => {
		type R = JobContextOf<T[number]>;
		const all = jobs as ReadonlyArray<Job<unknown, R>>;
		const index = new Map<string, Job<unknown, R>>();
		for (const job of all) {
			if (index.has(job.name)) {
				throw new Error(`duplicate job name: ${job.name}`);
			}
			index.set(job.name, job);
		}
		return { all, byName: (name) => index.get(name) };
	},
};
