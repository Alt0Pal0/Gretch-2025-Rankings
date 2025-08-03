const { sql } = require('@vercel/postgres');

// Auto-create tables if they don't exist
async function ensureTablesExist() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS page_views (
        id SERIAL PRIMARY KEY,
        page_path VARCHAR(255) NOT NULL,
        ip_address INET,
        user_agent TEXT,
        referrer TEXT,
        timestamp TIMESTAMP DEFAULT NOW(),
        session_id VARCHAR(64),
        is_unique_visitor BOOLEAN DEFAULT FALSE
      )
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_page_views_timestamp ON page_views(timestamp)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_page_views_page_path ON page_views(page_path)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_page_views_ip_ua ON page_views(ip_address, user_agent)
    `;
  } catch (error) {
    console.log('Tables may already exist:', error.message);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Ensure tables exist
    await ensureTablesExist();
    // Get overall stats for different time periods
    const overallStats = await sql`
      SELECT 
        'page_views' as metric,
        COUNT(*) FILTER (WHERE timestamp >= CURRENT_DATE) as today,
        COUNT(*) FILTER (WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days') as last_7_days,
        COUNT(*) FILTER (WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days') as last_30_days,
        COUNT(*) FILTER (WHERE timestamp >= CURRENT_DATE - INTERVAL '1 year') as last_year,
        COUNT(*) as all_time
      FROM page_views
      UNION ALL
      SELECT 
        'unique_visitors' as metric,
        COUNT(DISTINCT ip_address || user_agent) FILTER (WHERE timestamp >= CURRENT_DATE) as today,
        COUNT(DISTINCT ip_address || user_agent) FILTER (WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days') as last_7_days,
        COUNT(DISTINCT ip_address || user_agent) FILTER (WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days') as last_30_days,
        COUNT(DISTINCT ip_address || user_agent) FILTER (WHERE timestamp >= CURRENT_DATE - INTERVAL '1 year') as last_year,
        COUNT(DISTINCT ip_address || user_agent) as all_time
      FROM page_views
    `;

    // Get daily page views for last 60 days (for chart)
    const dailyViews = await sql`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as views
      FROM page_views 
      WHERE timestamp >= CURRENT_DATE - INTERVAL '60 days'
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `;

    // Get page-specific stats
    const pageStats = await sql`
      SELECT 
        page_path,
        COUNT(*) FILTER (WHERE timestamp >= CURRENT_DATE) as today,
        COUNT(*) FILTER (WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days') as last_7_days,
        COUNT(*) FILTER (WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days') as last_30_days,
        COUNT(*) FILTER (WHERE timestamp >= CURRENT_DATE - INTERVAL '1 year') as last_year,
        COUNT(*) as all_time
      FROM page_views
      GROUP BY page_path
      ORDER BY all_time DESC
    `;

    // Get visitor stats (by IP + User Agent combination)
    const visitorStats = await sql`
      SELECT 
        CONCAT(COALESCE(host(ip_address), 'unknown'), ' | ', 
               CASE 
                 WHEN LENGTH(user_agent) > 60 THEN CONCAT(LEFT(user_agent, 57), '...')
                 ELSE COALESCE(user_agent, 'unknown')
               END) as visitor_id,
        COUNT(*) FILTER (WHERE timestamp >= CURRENT_DATE) as today,
        COUNT(*) FILTER (WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days') as last_7_days,
        COUNT(*) FILTER (WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days') as last_30_days,
        COUNT(*) FILTER (WHERE timestamp >= CURRENT_DATE - INTERVAL '1 year') as last_year,
        COUNT(*) as all_time
      FROM page_views
      GROUP BY ip_address, user_agent
      ORDER BY all_time DESC
      LIMIT 50
    `;

    // Get login stats by password (from existing auth logs)
    const loginStats = await sql`
      SELECT 
        password_attempted,
        COUNT(*) FILTER (WHERE success = TRUE AND timestamp >= CURRENT_DATE) as today,
        COUNT(*) FILTER (WHERE success = TRUE AND timestamp >= CURRENT_DATE - INTERVAL '7 days') as last_7_days,
        COUNT(*) FILTER (WHERE success = TRUE AND timestamp >= CURRENT_DATE - INTERVAL '30 days') as last_30_days,
        COUNT(*) FILTER (WHERE success = TRUE AND timestamp >= CURRENT_DATE - INTERVAL '1 year') as last_year,
        COUNT(*) FILTER (WHERE success = TRUE) as all_time
      FROM edit_access_logs
      WHERE success = TRUE
      GROUP BY password_attempted
      ORDER BY all_time DESC
    `;

    return res.status(200).json({
      overall_stats: overallStats.rows || [],
      daily_views: dailyViews.rows || [],
      page_stats: pageStats.rows || [],
      visitor_stats: visitorStats.rows || [],
      login_stats: loginStats.rows || []
    });

  } catch (error) {
    console.error('Analytics data error:', error);
    
    // Return empty data structure if there's an error (likely no data yet)
    return res.status(200).json({
      overall_stats: [
        { metric: 'page_views', today: 0, last_7_days: 0, last_30_days: 0, last_year: 0, all_time: 0 },
        { metric: 'unique_visitors', today: 0, last_7_days: 0, last_30_days: 0, last_year: 0, all_time: 0 }
      ],
      daily_views: [],
      page_stats: [],
      visitor_stats: [],
      login_stats: []
    });
  }
};