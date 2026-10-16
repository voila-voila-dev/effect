import { Layer } from "effect";
import { RateLimiter as Limiter } from "effect/persistence";
import type { RateLimiter } from "../rate-limit/rate-limiter.ts";
import { rateLimiterFromStoreLayer } from "./rate-limiter-from-store.ts";

/**
 * A per-process `RateLimiter` for development, tests and single-instance
 * deployments. Each build of the layer counts from zero.
 */
export const inMemoryRateLimiterLayer: Layer.Layer<RateLimiter> =
	rateLimiterFromStoreLayer.pipe(Layer.provide(Limiter.layerStoreMemory));
