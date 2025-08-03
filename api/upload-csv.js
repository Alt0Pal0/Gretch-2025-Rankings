const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { players, notes } = req.body;

    if (!players || !Array.isArray(players)) {
      return res.status(400).json({ error: 'Invalid players data provided' });
    }

    // Start a transaction-like process
    // 1. Get current version info and find the next available version number
    const currentVersionResult = await sql`
      SELECT id, version_number 
      FROM ranking_versions 
      WHERE is_current = TRUE 
      LIMIT 1
    `;

    const currentVersion = currentVersionResult.rows[0];
    if (!currentVersion) {
      return res.status(500).json({ error: 'No current version found' });
    }

    // Find the next available version number (in case of gaps from failed uploads)
    const maxVersionResult = await sql`
      SELECT MAX(version_number) as max_version 
      FROM ranking_versions
    `;
    
    const maxVersion = maxVersionResult.rows[0].max_version || 0;
    const newVersionNumber = maxVersion + 1;

    // 2. Get current player positions for change calculation
    const currentPlayersResult = await sql`
      SELECT id, name, position, position_rank 
      FROM players 
      WHERE version_id = ${currentVersion.id} 
      ORDER BY position, position_rank
    `;

    // Create lookup map for ranking changes
    const oldPlayerRanks = {};
    currentPlayersResult.rows.forEach(p => {
      oldPlayerRanks[`${p.name}_${p.position}`] = p.position_rank;
    });

    // 3. Archive current version (set is_current = FALSE)
    await sql`
      UPDATE ranking_versions 
      SET is_current = FALSE 
      WHERE id = ${currentVersion.id}
    `;

    // 4. Create new version
    const newVersionResult = await sql`
      INSERT INTO ranking_versions (version_number, is_current, notes) 
      VALUES (${newVersionNumber}, TRUE, ${notes || null}) 
      RETURNING id
    `;

    const newVersionId = newVersionResult.rows[0].id;

    // 5. Process and insert all players with new version_id
    for (const player of players) {
      // Calculate ranking change
      const oldRank = oldPlayerRanks[`${player.name}_${player.position}`];
      const newRank = player.position_rank;
      const rankingChange = oldRank ? (oldRank - newRank) : 0; // Positive = moved up, negative = moved down

      // Insert player with new version_id
      await sql`
        INSERT INTO players (
          version_id, name, position, position_rank, nfl_team, bye_week,
          is_bold, is_italic, small_tier_break, big_tier_break,
          news_copy, ranking_change
        ) VALUES (
          ${newVersionId}, 
          ${player.name}, 
          ${player.position}, 
          ${player.position_rank}, 
          ${player.nfl_team || 'TBD'}, 
          ${player.bye_week || null},
          ${player.is_bold || false}, 
          ${player.is_italic || false}, 
          ${player.small_tier_break || false}, 
          ${player.big_tier_break || false},
          ${player.news_copy || null}, 
          ${rankingChange}
        )
      `;
    }

    // 6. Return success response
    res.status(200).json({
      success: true,
      message: 'CSV uploaded successfully',
      newVersion: newVersionNumber,
      playersUpdated: players.length
    });

  } catch (error) {
    console.error('CSV upload error:', error);
    
    // Attempt to rollback by restoring current version if possible
    try {
      const currentVersionResult = await sql`
        SELECT id FROM ranking_versions 
        WHERE version_number = (SELECT MAX(version_number) - 1 FROM ranking_versions)
      `;
      
      if (currentVersionResult.rows.length > 0) {
        await sql`
          UPDATE ranking_versions 
          SET is_current = TRUE 
          WHERE id = ${currentVersionResult.rows[0].id}
        `;
        
        await sql`
          UPDATE ranking_versions 
          SET is_current = FALSE 
          WHERE id != ${currentVersionResult.rows[0].id}
        `;
      }
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError);
    }

    res.status(500).json({
      error: 'Failed to upload CSV',
      details: error.message
    });
  }
};