const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { players, notes } = req.body;

    if (!players || typeof players !== 'object') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid players data provided' 
      });
    }

    // Start transaction-like operations
    console.log('Starting rankings update...');

    // 1. Get current version info and find next available version number
    const currentVersionResult = await sql`
      SELECT id, version_number 
      FROM ranking_versions 
      WHERE is_current = TRUE 
      LIMIT 1
    `;

    if (currentVersionResult.rows.length === 0) {
      throw new Error('No current version found');
    }

    const currentVersion = currentVersionResult.rows[0];

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

    const currentPlayerPositions = {};
    currentPlayersResult.rows.forEach(player => {
      currentPlayerPositions[player.name] = {
        position: player.position,
        rank: player.position_rank
      };
    });

    // 3. Archive current version
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

    // 5. Process and insert new player data
    const allPlayers = [];
    
    for (const [position, positionPlayers] of Object.entries(players)) {
      if (!Array.isArray(positionPlayers)) continue;
      
      positionPlayers.forEach((player, index) => {
        // Calculate ranking change
        let rankingChange = 0;
        const currentPlayerData = currentPlayerPositions[player.name];
        
        if (currentPlayerData && currentPlayerData.position === position) {
          // Player exists in same position, calculate change
          const oldRank = currentPlayerData.rank;
          const newRank = index + 1;
          rankingChange = oldRank - newRank; // Positive = moved up, negative = moved down
        } else if (currentPlayerData) {
          // Player changed positions - mark as significant change
          rankingChange = 0; // Could implement cross-position change logic here
        }
        // New players have rankingChange = 0

        allPlayers.push({
          ...player,
          version_id: newVersionId,
          position: position,
          position_rank: index + 1,
          ranking_change: rankingChange
        });
      });
    }

    // 6. Insert all players for new version
    for (const player of allPlayers) {
      // For new players (with temporary IDs), don't include the ID in the insert
      if (player.isNew || player.id > 900000000) { // Temporary IDs are large numbers
        await sql`
          INSERT INTO players (
            version_id, name, position, position_rank, nfl_team, bye_week,
            is_bold, is_italic, small_tier_break, big_tier_break, 
            news_copy, ranking_change
          ) VALUES (
            ${player.version_id}, ${player.name}, ${player.position}, 
            ${player.position_rank}, ${player.nfl_team}, ${player.bye_week},
            ${player.is_bold}, ${player.is_italic}, ${player.small_tier_break}, 
            ${player.big_tier_break}, ${player.news_copy || null}, ${player.ranking_change}
          )
        `;
      } else {
        // For existing players, we still create new records (versioned system)
        await sql`
          INSERT INTO players (
            version_id, name, position, position_rank, nfl_team, bye_week,
            is_bold, is_italic, small_tier_break, big_tier_break, 
            news_copy, ranking_change
          ) VALUES (
            ${player.version_id}, ${player.name}, ${player.position}, 
            ${player.position_rank}, ${player.nfl_team}, ${player.bye_week},
            ${player.is_bold}, ${player.is_italic}, ${player.small_tier_break}, 
            ${player.big_tier_break}, ${player.news_copy || null}, ${player.ranking_change}
          )
        `;
      }
    }

    console.log(`Successfully created version ${newVersionNumber} with ${allPlayers.length} players`);

    res.status(200).json({
      success: true,
      message: `Rankings updated successfully to version ${newVersionNumber}`,
      version: {
        id: newVersionId,
        version_number: newVersionNumber,
        player_count: allPlayers.length
      }
    });

  } catch (error) {
    console.error('Update rankings error:', error);
    
    // Try to restore current version if something went wrong
    try {
      await sql`
        UPDATE ranking_versions 
        SET is_current = TRUE 
        WHERE version_number = (
          SELECT MAX(version_number) 
          FROM ranking_versions 
          WHERE version_number < (SELECT MAX(version_number) FROM ranking_versions)
        )
      `;
    } catch (restoreError) {
      console.error('Failed to restore current version:', restoreError);
    }

    res.status(500).json({ 
      success: false,
      message: 'Failed to update rankings: ' + error.message,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};