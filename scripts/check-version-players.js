require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function checkVersionPlayers() {
  try {
    console.log('Checking player counts for recent versions...');
    
    // Check player counts for the recent versions
    const versions = [34, 33, 32, 31, 30, 29]; // v29=ID 34, v28=ID 33, etc.
    
    for (const versionId of versions) {
      const result = await sql`
        SELECT v.version_number, COUNT(p.id) as player_count
        FROM ranking_versions v
        LEFT JOIN players p ON p.version_id = v.id
        WHERE v.id = ${versionId}
        GROUP BY v.id, v.version_number
      `;
      
      if (result.rows.length > 0) {
        const row = result.rows[0];
        console.log(`Version ${row.version_number} (ID ${versionId}): ${row.player_count} players`);
      } else {
        console.log(`Version ID ${versionId}: Not found`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking version players:', error);
    process.exit(1);
  }
}

checkVersionPlayers();