import { Effect } from "effect";

const program = Effect.log("done");

Effect.runPromise(program); // fires
process.exit(1); // fires
Effect.runPromiseExit(program); // fires
Effect.runSync(program); // fires
Effect.runSyncExit(program); // fires
Effect.runFork(program); // fires
process.exit(); // fires
