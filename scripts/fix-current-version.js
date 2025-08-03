require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function fixCurrentVersion() {
  try {
    console.log('Fixing current version to restore player data...');
    
    // First, clear all current flags
    await sql`UPDATE ranking_versions SET is_current = FALSE`;
    
    // Set v22 (ID 22) as current since it has all 270 players
    const result = await sql`
      UPDATE ranking_versions 
      SET is_current = TRUE 
      WHERE id = 22
      RETURNING version_number
    `;
    
    if (result.rows.length > 0) {
      console.log(`✅ Version ${result.rows[0].version_number} is now current`);
      
      // Verify player count
      const playerCount = await sql`
        SELECT COUNT(*) as total
        FROM players 
        WHERE version_id = 22
      `;
      
      console.log(`🏈 Players in current version: ${playerCount.rows[0].total}`);
    } else {
      console.log('❌ Failed to update current version');
    }
    
  } catch (error) {
    console.error('❌ Error fixing current version:', error);
    process.exit(1);
  }
}

fixCurrentVersion();