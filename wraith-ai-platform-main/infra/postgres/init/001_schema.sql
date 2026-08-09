CREATE TABLE IF NOT EXISTS normalized_events (
    event_id TEXT PRIMARY KEY,
    occurred_at TIMESTAMPTZ NOT NULL,
    session_id TEXT,
    source_ip INET,
    service TEXT NOT NULL,
    action TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('info','low','medium','high','critical')),
    risk_score SMALLINT NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
    executed BOOLEAN NOT NULL DEFAULT FALSE CHECK (executed = FALSE),
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_time ON normalized_events (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_source_ip ON normalized_events (source_ip);
CREATE INDEX IF NOT EXISTS idx_events_payload_gin ON normalized_events USING GIN (payload);

CREATE TABLE IF NOT EXISTS analyst_audit (
    audit_id BIGSERIAL PRIMARY KEY,
    analyst_id TEXT NOT NULL,
    action TEXT NOT NULL,
    target_id TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

