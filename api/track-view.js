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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Ensure tables exist
    await ensureTablesExist();
    const { page_path, referrer } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    if (!page_path) {
      return res.status(400).json({ error: 'page_path required' });
    }

    // Check if this is a unique visitor (first visit from this IP/UA in last 24 hours)
    const recentVisit = await sql`
      SELECT id FROM page_views 
      WHERE ip_address = ${ip} 
      AND user_agent = ${userAgent}
      AND timestamp > NOW() - INTERVAL '24 hours'
      LIMIT 1
    `;

    const isUniqueVisitor = recentVisit.rows.length === 0;

    // Insert page view
    await sql`
      INSERT INTO page_views (
        page_path, ip_address, user_agent, referrer, is_unique_visitor
      ) VALUES (
        ${page_path}, ${ip}, ${userAgent}, ${referrer || null}, ${isUniqueVisitor}
      )
    `;

    return res.status(200).json({ 
      success: true, 
      tracked: true,
      unique_visitor: isUniqueVisitor
    });

  } catch (error) {
    console.error('Analytics tracking error:', error);
    return res.status(500).json({ error: 'Failed to track view' });
  }
};