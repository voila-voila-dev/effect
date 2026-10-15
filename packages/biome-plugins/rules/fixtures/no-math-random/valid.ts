import { Effect, Random } from "effect";

export const jitter = Effect.map(Random.next, (value) => value * 100);

export const token = crypto.getRandomValues(new Uint8Array(32));

export const rounded = Math.floor(4.2);
