require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function checkAllRankings() {
  try {
    console.log('Checking all positions for duplicate rankings...');
    
    const positions = ['QB', 'RB', 'WR', 'TE'];
    
    for (const position of positions) {
      console.log(`\n📊 ${position} RANKINGS:`);
      
      // Get all players in this position
      const result = await sql`
        SELECT p.name, p.position_rank
        FROM players p
        JOIN ranking_versions v ON p.version_id = v.id
        WHERE v.is_current = TRUE
        AND p.position = ${position}
        ORDER BY p.position_rank
      `;
      
      // Track duplicates
      const ranks = {};
      result.rows.forEach(player => {
        if (ranks[player.position_rank]) {
          ranks[player.position_rank].push(player.name);
        } else {
          ranks[player.position_rank] = [player.name];
        }
      });
      
      // Check for duplicates
      let hasDuplicates = false;
      Object.keys(ranks).forEach(rank => {
        if (ranks[rank].length > 1) {
          console.log(`❌ DUPLICATE RANK ${rank}: ${ranks[rank].join(', ')}`);
          hasDuplicates = true;
        }
      });
      
      if (!hasDuplicates) {
        console.log(`✅ No duplicates found (${result.rows.length} players)`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking rankings:', error);
    process.exit(1);
  }
}

checkAllRankings();