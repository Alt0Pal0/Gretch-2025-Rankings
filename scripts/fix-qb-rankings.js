require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function fixQBRankings() {
  try {
    console.log('Fixing QB rankings to remove duplicates...');
    
    // Get all QB players in current version, ordered by rank, then by name for consistent ordering
    const result = await sql`
      SELECT p.id, p.name, p.position_rank
      FROM players p
      JOIN ranking_versions v ON p.version_id = v.id
      WHERE v.is_current = TRUE
      AND p.position = 'QB'
      ORDER BY p.position_rank, p.name
    `;
    
    console.log(`Found ${result.rows.length} QB players`);
    
    // Re-rank them sequentially starting from 1
    console.log('\nRe-ranking QBs sequentially...');
    
    for (let i = 0; i < result.rows.length; i++) {
      const player = result.rows[i];
      const newRank = i + 1;
      
      if (player.position_rank !== newRank) {
        await sql`
          UPDATE players 
          SET position_rank = ${newRank}
          WHERE id = ${player.id}
        `;
        console.log(`${player.name}: ${player.position_rank} → ${newRank}`);
      } else {
        console.log(`${player.name}: ${newRank} (unchanged)`);
      }
    }
    
    console.log('\n✅ QB rankings fixed! All ranks are now unique and sequential.');
    console.log('🎯 You can now move Lamar Jackson from his current rank to rank 1!');
    
  } catch (error) {
    console.error('❌ Error fixing QB rankings:', error);
    process.exit(1);
  }
}

fixQBRankings();