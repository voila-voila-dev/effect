import { Effect } from "effect";
import { Redis } from "effect/persistence";

export interface SentCommand {
	readonly command: string;
	readonly args: ReadonlyArray<string>;
}

/**
 * An in-memory `Redis` answering the commands this package sends, so the
 * adapters are tested without a server. Expiry is recorded, not enforced. The
 * two Lua scripts are recognised by what they call, not run.
 */
export function makeFakeRedis() {
	const store = new Map<string, string>();
	const scripts = new Map<string, string>();
	const sent: Array<SentCommand> = [];

	const evaluate = (
		lua: string,
		keys: ReadonlyArray<string>,
		argv: ReadonlyArray<string>,
	) => {
		const [key = ""] = keys;
		if (lua.includes("INCR")) {
			const total = Number(store.get(key) ?? 0) + 1;
			store.set(key, String(total));
			return total;
		}
		if (store.get(key) === argv[0]) {
			store.delete(key);
			return 1;
		}
		return 0;
	};

	const answer = (command: string, args: ReadonlyArray<string>): unknown => {
		const [first = "", second = ""] = args;
		switch (command) {
			case "GET":
				return store.get(first) ?? null;
			case "SET":
				if (args.includes("NX") && store.has(first)) {
					return null;
				}
				store.set(first, second);
				return "OK";
			case "DEL":
				return store.delete(first) ? 1 : 0;
			case "SCRIPT": {
				const sha = `sha-${scripts.size}`;
				scripts.set(sha, second);
				return sha;
			}
			case "EVALSHA": {
				const lua = scripts.get(first);
				if (lua === undefined) {
					throw new Error("NOSCRIPT");
				}
				const keyCount = Number(second);
				return evaluate(
					lua,
					args.slice(2, 2 + keyCount),
					args.slice(2 + keyCount),
				);
			}
			default:
				throw new Error(`unexpected command ${command}`);
		}
	};

	const redis = Effect.runSync(
		Redis.make({
			send: <A>(command: string, ...args: ReadonlyArray<string>) =>
				Effect.try({
					try: () => {
						sent.push({ command, args });
						return answer(command, args) as A;
					},
					catch: (cause) => new Redis.RedisError({ cause }),
				}),
			subscribe: () => Effect.die("no pub/sub in these tests"),
		}),
	);
	return { redis, store, sent };
}

/** A `Redis` whose every command fails, standing in for an outage. */
export function makeUnreachableRedis(): Redis.Redis["Service"] {
	return Effect.runSync(
		Redis.make({
			send: () =>
				Effect.fail(
					new Redis.RedisError({ cause: new Error("connection refused") }),
				),
			subscribe: () => Effect.die("no pub/sub in these tests"),
		}),
	);
}
