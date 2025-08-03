-- Analytics tracking tables

CREATE TABLE IF NOT EXISTS page_views (
  id SERIAL PRIMARY KEY,
  page_path VARCHAR(255) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  session_id VARCHAR(64),
  is_unique_visitor BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS daily_stats (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  total_page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_page_views_timestamp ON page_views(timestamp);
CREATE INDEX IF NOT EXISTS idx_page_views_page_path ON page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_ip_ua ON page_views(ip_address, user_agent);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);

-- Function to update daily stats
CREATE OR REPLACE FUNCTION update_daily_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO daily_stats (date, total_page_views, unique_visitors)
  VALUES (
    DATE(NEW.timestamp),
    1,
    CASE WHEN NEW.is_unique_visitor THEN 1 ELSE 0 END
  )
  ON CONFLICT (date)
  DO UPDATE SET
    total_page_views = daily_stats.total_page_views + 1,
    unique_visitors = daily_stats.unique_visitors + 
      CASE WHEN NEW.is_unique_visitor THEN 1 ELSE 0 END,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update daily stats
DROP TRIGGER IF EXISTS trigger_update_daily_stats ON page_views;
CREATE TRIGGER trigger_update_daily_stats
  AFTER INSERT ON page_views
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_stats();