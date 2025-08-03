require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function fixCurrentToV27() {
  try {
    console.log('Setting v27 (ID 32) as current version...');
    
    // First, clear all current flags
    await sql`UPDATE ranking_versions SET is_current = FALSE`;
    
    // Set v27 (ID 32) as current since it has your 270 players with CSV data
    const result = await sql`
      UPDATE ranking_versions 
      SET is_current = TRUE 
      WHERE id = 32
      RETURNING version_number
    `;
    
    if (result.rows.length > 0) {
      console.log(`✅ Version ${result.rows[0].version_number} is now current`);
      
      // Verify player count
      const playerCount = await sql`
        SELECT COUNT(*) as total
        FROM players 
        WHERE version_id = 32
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

fixCurrentToV27();