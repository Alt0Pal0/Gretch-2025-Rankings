const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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
      overall_stats: overallStats.rows,
      daily_views: dailyViews.rows,
      page_stats: pageStats.rows,
      login_stats: loginStats.rows
    });

  } catch (error) {
    console.error('Analytics data error:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
};