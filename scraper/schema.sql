-- ============================================
-- Supabase Schema: Berliner Arbeitsmarkt-Dashboard
-- ============================================

-- Jobs-Tabelle
CREATE TABLE IF NOT EXISTS jobs (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    source          TEXT NOT NULL CHECK (source IN ('stepstone', 'indeed')),
    title           TEXT NOT NULL,
    company         TEXT,
    location        TEXT,
    url             TEXT UNIQUE NOT NULL,
    description     TEXT,
    salary_raw      TEXT,
    salary_min      INTEGER,
    salary_max      INTEGER,
    posted_date     DATE,
    scraped_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    score           INTEGER NOT NULL DEFAULT 0,      -- 0-100
    score_label     TEXT NOT NULL DEFAULT 'rot',      -- gruen / gelb / rot
    is_relevant     BOOLEAN NOT NULL DEFAULT TRUE,
    tags            TEXT[] DEFAULT '{}',
    notes           TEXT
);

-- Indizes
CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source);
CREATE INDEX IF NOT EXISTS idx_jobs_score ON jobs(score DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_scraped ON jobs(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_score_label ON jobs(score_label);

-- Row Level Security
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Anon darf lesen (für das Dashboard)
CREATE POLICY "Public read access" ON jobs
    FOR SELECT USING (true);

-- Policy: Service-Role darf alles (für den Scraper)
CREATE POLICY "Service full access" ON jobs
    FOR ALL USING (true) WITH CHECK (true);

-- Scoring-Log (optional, für Nachvollziehbarkeit)
CREATE TABLE IF NOT EXISTS scoring_log (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    job_id          BIGINT REFERENCES jobs(id) ON DELETE CASCADE,
    category        TEXT NOT NULL,
    keyword         TEXT NOT NULL,
    points          INTEGER NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scoring_job ON scoring_log(job_id);
