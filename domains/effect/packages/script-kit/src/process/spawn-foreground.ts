import { Effect } from "effect";

/**
 * Runs a command in the foreground (Bun only): stdio is inherited and Ctrl-C
 * is forwarded so the child stops gracefully. Succeeds with the child's exit
 * code; interrupting the effect kills the child.
 */
export function spawnForeground(
	command: ReadonlyArray<string>,
	options: { readonly cwd: string; readonly env?: Record<string, string> },
): Effect.Effect<number> {
	return Effect.callback<number>((resume, signal) => {
		const child = Bun.spawn([...command], {
			cwd: options.cwd,
			env: options.env ? { ...process.env, ...options.env } : process.env,
			stdin: "inherit",
			stdout: "inherit",
			stderr: "inherit",
		});
		function forward(): void {
			child.kill("SIGINT");
		}
		process.on("SIGINT", forward);
		process.on("SIGTERM", forward);
		function detach(): void {
			process.off("SIGINT", forward);
			process.off("SIGTERM", forward);
		}
		signal.addEventListener("abort", () => {
			child.kill();
			detach();
		});
		child.exited.then((code) => {
			detach();
			resume(Effect.succeed(code ?? 0));
		});
	});
}
