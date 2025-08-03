require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function checkTeamUsage() {
  try {
    console.log('Checking current NFL team abbreviations in database...');
    
    // Get all unique team abbreviations currently in use
    const result = await sql`
      SELECT DISTINCT nfl_team, COUNT(*) as player_count
      FROM players 
      GROUP BY nfl_team 
      ORDER BY nfl_team
    `;
    
    console.log('\nCurrent team abbreviations in database:');
    result.rows.forEach(row => {
      console.log(`${row.nfl_team}: ${row.player_count} players`);
    });
    
    // Expected abbreviations from constraint
    const expectedTeams = [
      'ARZ','ATL','BLT','BUF','CAR','CHI','CIN','CLV','DAL','DEN',
      'DET','GB','HST','IND','JAX','KC','LA','LAC','MIA','MIN',
      'NE','NO','NYG','NYJ','OAK','PHI','PIT','SEA','SF','TB','TEN','WAS'
    ];
    
    const actualTeams = result.rows.map(row => row.nfl_team);
    const missingFromConstraint = actualTeams.filter(team => !expectedTeams.includes(team));
    
    if (missingFromConstraint.length > 0) {
      console.log('\n❌ Teams in database but NOT in constraint:');
      missingFromConstraint.forEach(team => console.log(`  ${team}`));
    } else {
      console.log('\n✅ All teams in database are in the constraint');
    }
    
  } catch (error) {
    console.error('❌ Error checking team usage:', error);
    process.exit(1);
  }
}

checkTeamUsage();