-- Gretch 2025 Rankings Database Schema
-- Created for dynamic player rankings system

-- Versions table to track ranking updates
CREATE TABLE IF NOT EXISTS ranking_versions (
  id SERIAL PRIMARY KEY,
  version_number INTEGER NOT NULL UNIQUE,
  version_date TIMESTAMP DEFAULT NOW(),
  is_current BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Players table with all attributes
CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  version_id INTEGER REFERENCES ranking_versions(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  position VARCHAR(2) NOT NULL CHECK (position IN ('QB', 'RB', 'WR', 'TE')),
  position_rank INTEGER NOT NULL,
  nfl_team VARCHAR(3) NOT NULL CHECK (nfl_team IN (
    'ARZ','ARI','ATL','BAL','BLT','BUF','CAR','CHI','CIN','CLE','CLV','DAL','DEN',
    'DET','GB','HOU','HST','IND','JAX','KC','LA','LAC','LAR','LV','MIA','MIN',
    'NE','NO','NYG','NYJ','OAK','PHI','PIT','SEA','SF','TB','TEN','WAS','TBD'
  )),
  bye_week INTEGER CHECK (bye_week BETWEEN 1 AND 18),
  is_bold BOOLEAN DEFAULT FALSE,
  is_italic BOOLEAN DEFAULT FALSE,
  small_tier_break BOOLEAN DEFAULT FALSE,
  big_tier_break BOOLEAN DEFAULT FALSE,
  news_copy TEXT,
  ranking_change INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_players_version_position ON players(version_id, position, position_rank);
CREATE INDEX IF NOT EXISTS idx_players_current_version ON players(version_id) 
  WHERE EXISTS (SELECT 1 FROM ranking_versions WHERE id = version_id AND is_current = TRUE);
CREATE INDEX IF NOT EXISTS idx_ranking_versions_current ON ranking_versions(is_current) WHERE is_current = TRUE;

-- Function to ensure only one current version
CREATE OR REPLACE FUNCTION ensure_single_current_version()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_current = TRUE THEN
    UPDATE ranking_versions SET is_current = FALSE WHERE id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce single current version
DROP TRIGGER IF EXISTS trigger_single_current_version ON ranking_versions;
CREATE TRIGGER trigger_single_current_version
  AFTER INSERT OR UPDATE OF is_current ON ranking_versions
  FOR EACH ROW
  WHEN (NEW.is_current = TRUE)
  EXECUTE FUNCTION ensure_single_current_version();