require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function checkQBRankings() {
  try {
    console.log('Checking QB rankings for duplicates...');
    
    // Get all QB players in current version, ordered by rank
    const result = await sql`
      SELECT p.name, p.position_rank
      FROM players p
      JOIN ranking_versions v ON p.version_id = v.id
      WHERE v.is_current = TRUE
      AND p.position = 'QB'
      ORDER BY p.position_rank
    `;
    
    console.log('\nCurrent QB Rankings:');
    console.log('Rank | Player Name');
    console.log('-----|------------');
    
    const ranks = {};
    result.rows.forEach(player => {
      console.log(`${player.position_rank.toString().padStart(4)} | ${player.name}`);
      
      // Track duplicates
      if (ranks[player.position_rank]) {
        ranks[player.position_rank].push(player.name);
      } else {
        ranks[player.position_rank] = [player.name];
      }
    });
    
    // Check for duplicates
    console.log('\n🔍 Checking for duplicate rankings...');
    let hasDuplicates = false;
    
    Object.keys(ranks).forEach(rank => {
      if (ranks[rank].length > 1) {
        console.log(`❌ DUPLICATE RANK ${rank}: ${ranks[rank].join(', ')}`);
        hasDuplicates = true;
      }
    });
    
    if (!hasDuplicates) {
      console.log('✅ No duplicate rankings found');
    } else {
      console.log('\n💡 This explains the 500 error - the update API expects unique rankings!');
    }
    
  } catch (error) {
    console.error('❌ Error checking QB rankings:', error);
    process.exit(1);
  }
}

checkQBRankings();