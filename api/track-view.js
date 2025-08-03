const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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