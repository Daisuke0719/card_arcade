CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  status TEXT NOT NULL,
  rules_version TEXT NOT NULL,
  max_players INTEGER NOT NULL,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  started_at INTEGER,
  finished_at INTEGER
);

CREATE TABLE IF NOT EXISTS match_players (
  match_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  seat INTEGER NOT NULL,
  display_name TEXT NOT NULL,
  joined_at INTEGER NOT NULL,
  left_at INTEGER,
  result TEXT,
  PRIMARY KEY (match_id, player_id)
);

CREATE TABLE IF NOT EXISTS match_events (
  match_id TEXT NOT NULL,
  revision INTEGER NOT NULL,
  player_id TEXT,
  action_type TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (match_id, revision)
);
