# Changesets

Every PR that changes a published package adds one: `bun run changeset`, pick the
packages and the bump, write one line for the changelog. Merging to `main` opens
(or updates) the "Version packages" PR; merging that one publishes to npm.
