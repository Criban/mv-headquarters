-- One validated API reading per player and Berlin calendar day.
CREATE TABLE IF NOT EXISTS bf6_daily_stats (
  player_name text NOT NULL,
  day date NOT NULL,
  captured_at timestamptz NOT NULL,
  metrics jsonb NOT NULL CHECK (jsonb_typeof(metrics) = 'object'),
  snapshot jsonb NOT NULL CHECK (jsonb_typeof(snapshot) = 'object'),
  PRIMARY KEY (player_name, day),
  CHECK (day = (captured_at AT TIME ZONE 'Europe/Berlin')::date)
);
