// Registers happy-dom's window on globalThis for every test file in this
// workspace: bun test has no per-file environment, so DOM globals are
// workspace-wide (the node-only tests tolerate them).
import { GlobalRegistrator } from "@happy-dom/global-registrator";

// An http origin, so `history.replaceState` can rewrite the address as in a browser.
GlobalRegistrator.register({ url: "http://localhost/" });
