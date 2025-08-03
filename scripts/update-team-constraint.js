require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function updateTeamConstraint() {
  try {
    console.log('Updating NFL team constraint to include standard abbreviations...');
    
    // Drop the existing constraint
    await sql`
      ALTER TABLE players 
      DROP CONSTRAINT IF EXISTS players_nfl_team_check
    `;
    
    // Add the new constraint with additional team abbreviations including TBD
    await sql`
      ALTER TABLE players 
      ADD CONSTRAINT players_nfl_team_check 
      CHECK (nfl_team IN (
        'ARZ','ARI','ATL','BAL','BLT','BUF','CAR','CHI','CIN','CLE','CLV','DAL','DEN',
        'DET','GB','HOU','HST','IND','JAX','KC','LA','LAC','LAR','LV','MIA','MIN',
        'NE','NO','NYG','NYJ','OAK','PHI','PIT','SEA','SF','TB','TEN','WAS','TBD'
      ))
    `;
    
    console.log('✅ NFL team constraint updated successfully!');
    console.log('Added support for: ARI, BAL, CLE, HOU, LAR, LV, TBD');
    
  } catch (error) {
    console.error('❌ Error updating constraint:', error);
    process.exit(1);
  }
}

updateTeamConstraint();