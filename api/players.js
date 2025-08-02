const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get current version players, organized by position
    const { rows } = await sql`
      SELECT p.*
      FROM players p
      JOIN ranking_versions v ON p.version_id = v.id
      WHERE v.is_current = TRUE
      AND p.position IN ('QB', 'RB', 'WR', 'TE')
      ORDER BY p.position, p.position_rank
    `;

    // Group players by position
    const playersByPosition = {
      QB: [],
      RB: [],
      WR: [],
      TE: []
    };

    rows.forEach(player => {
      if (playersByPosition[player.position]) {
        playersByPosition[player.position].push({
          id: player.id,
          name: player.name,
          position: player.position,
          position_rank: player.position_rank,
          nfl_team: player.nfl_team,
          bye_week: player.bye_week,
          is_bold: player.is_bold,
          is_italic: player.is_italic,
          small_tier_break: player.small_tier_break,
          big_tier_break: player.big_tier_break,
          news_copy: player.news_copy,
          ranking_change: player.ranking_change
        });
      }
    });

    // Get current version info
    const versionResult = await sql`
      SELECT version_number, version_date, notes
      FROM ranking_versions
      WHERE is_current = TRUE
      LIMIT 1
    `;

    const currentVersion = versionResult.rows[0];

    res.status(200).json({
      success: true,
      version: currentVersion,
      players: playersByPosition
    });

  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}