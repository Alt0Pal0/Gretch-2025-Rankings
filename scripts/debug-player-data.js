// Debug Player Data - Check data structure and validate
require('dotenv').config({ path: '.env.local' });

const { sql } = require('@vercel/postgres');

async function debugPlayerData() {
    try {
        console.log('🔍 Analyzing player data structure from version 41...');
        
        // Get a sample of players from version 41 to see the expected structure
        const samplePlayers = await sql`
            SELECT 
                name, position, position_rank, nfl_team, bye_week,
                is_bold, is_italic, small_tier_break, big_tier_break, news_copy
            FROM players p
            JOIN ranking_versions v ON p.version_id = v.id
            WHERE v.version_number = 41
            ORDER BY position, position_rank
            LIMIT 5
        `;
        
        console.log('📝 Sample player data structure from version 41:');
        samplePlayers.rows.forEach((p, i) => {
            console.log(`${i + 1}. ${p.name} (${p.position}${p.position_rank})`);
            console.log(`   Team: ${p.nfl_team}, Bye: ${p.bye_week}`);
            console.log(`   Bold: ${p.is_bold}, Italic: ${p.is_italic}`);
            console.log(`   Small tier: ${p.small_tier_break}, Big tier: ${p.big_tier_break}`);
            console.log(`   News: ${p.news_copy ? 'Has news' : 'No news'}`);
            console.log('');
        });
        
        // Check for any data anomalies
        console.log('🔍 Checking for data anomalies in version 41...');
        
        const anomalies = await sql`
            SELECT 
                'Missing team' as issue,
                COUNT(*) as count
            FROM players p
            JOIN ranking_versions v ON p.version_id = v.id
            WHERE v.version_number = 41 AND (nfl_team IS NULL OR nfl_team = '')
            
            UNION ALL
            
            SELECT 
                'Missing bye week' as issue,
                COUNT(*) as count
            FROM players p
            JOIN ranking_versions v ON p.version_id = v.id
            WHERE v.version_number = 41 AND bye_week IS NULL
            
            UNION ALL
            
            SELECT 
                'Invalid position' as issue,
                COUNT(*) as count
            FROM players p
            JOIN ranking_versions v ON p.version_id = v.id
            WHERE v.version_number = 41 AND position NOT IN ('QB', 'RB', 'WR', 'TE')
        `;
        
        console.log('⚠️ Data anomalies found:');
        anomalies.rows.forEach(a => {
            if (parseInt(a.count) > 0) {
                console.log(`   ${a.issue}: ${a.count} players`);
            }
        });
        
        // Check position counts
        const positionCounts = await sql`
            SELECT position, COUNT(*) as count
            FROM players p
            JOIN ranking_versions v ON p.version_id = v.id
            WHERE v.version_number = 41
            GROUP BY position
            ORDER BY position
        `;
        
        console.log('📊 Position distribution in version 41:');
        positionCounts.rows.forEach(p => {
            console.log(`   ${p.position}: ${p.count} players`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

debugPlayerData();