-- @voila.dev/outbox: the table PostgresOutboxStore reads and writes.
-- Apply it with your own migration tool. To use another table name, rename it
-- here and pass the same name as `table` to PostgresOutboxStore.layer.

CREATE TABLE IF NOT EXISTS outbox (
	id text PRIMARY KEY,
	channel text NOT NULL,
	tag text NOT NULL,
	payload jsonb NOT NULL,
	-- pending: owed; delivered: done, pruned by age; parked: gave up, kept for an operator.
	state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'delivered', 'parked')),
	attempts integer NOT NULL DEFAULT 0,
	-- A claim pushes this forward by the lease, a retry by the backoff.
	available_at timestamptz NOT NULL DEFAULT now(),
	last_error text,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);

-- Only what is owed is indexed, so a claim scans the backlog, not the history.
CREATE INDEX IF NOT EXISTS outbox_due_idx
	ON outbox (channel, available_at)
	WHERE state = 'pending';

CREATE INDEX IF NOT EXISTS outbox_delivered_idx
	ON outbox (created_at)
	WHERE state = 'delivered';
