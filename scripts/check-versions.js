require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function checkVersions() {
  try {
    console.log('Checking current ranking versions...');
    
    // Get all versions ordered by version number
    const result = await sql`
      SELECT id, version_number, is_current, version_date, notes
      FROM ranking_versions 
      ORDER BY version_number DESC
    `;
    
    console.log('\nAll versions in database:');
    result.rows.forEach(row => {
      const current = row.is_current ? ' (CURRENT)' : '';
      const date = new Date(row.version_date).toLocaleDateString();
      console.log(`v${row.version_number}: ID ${row.id}, ${date}${current}`);
      if (row.notes) console.log(`  Notes: ${row.notes}`);
    });
    
    // Check for current version
    const currentResult = await sql`
      SELECT id, version_number 
      FROM ranking_versions 
      WHERE is_current = TRUE 
      LIMIT 1
    `;
    
    if (currentResult.rows.length > 0) {
      const current = currentResult.rows[0];
      console.log(`\n✅ Current version: v${current.version_number} (ID: ${current.id})`);
      console.log(`📊 Next version would be: v${current.version_number + 1}`);
    } else {
      console.log('\n❌ No current version found!');
    }
    
    // Count players in current version
    if (currentResult.rows.length > 0) {
      const playerCount = await sql`
        SELECT COUNT(*) as total
        FROM players 
        WHERE version_id = ${currentResult.rows[0].id}
      `;
      console.log(`🏈 Players in current version: ${playerCount.rows[0].total}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking versions:', error);
    process.exit(1);
  }
}

checkVersions();