import { BunRuntime } from "@effect/platform-bun";
import { Effect } from "effect";

const program = Effect.log("done");

BunRuntime.runMain(program);
