-- D1 schema (reference copy — actual migrations in db/migrations/)
CREATE TABLE IF NOT EXISTS results (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  code TEXT NOT NULL,
  vs INTEGER NOT NULL,
  od INTEGER NOT NULL,
  lh INTEGER NOT NULL,
  pi INTEGER NOT NULL,
  skill_reaction INTEGER NOT NULL,
  skill_memory INTEGER NOT NULL,
  skill_logic INTEGER NOT NULL,
  skill_empathy INTEGER NOT NULL,
  skill_planning INTEGER NOT NULL,
  per_game TEXT NOT NULL,
  locale TEXT NOT NULL,
  ua_class TEXT,
  country TEXT,
  app_version TEXT NOT NULL,
  consented INTEGER NOT NULL DEFAULT 1,
  borderline_axes TEXT,
  confidence_min TEXT
);

CREATE INDEX IF NOT EXISTS idx_results_created_at ON results(created_at);
CREATE INDEX IF NOT EXISTS idx_results_code ON results(code);
