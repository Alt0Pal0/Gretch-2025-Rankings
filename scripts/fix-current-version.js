// Fix Current Version - Restore a working current version
require('dotenv').config({ path: '.env.local' });

const { sql } = require('@vercel/postgres');

async function fixCurrentVersion() {
    try {
        console.log('🔍 Checking current version status...');
        
        // Check if there's a current version
        const currentVersionCheck = await sql`
            SELECT id, version_number, is_current 
            FROM ranking_versions 
            WHERE is_current = TRUE 
            LIMIT 1
        `;
        
        if (currentVersionCheck.rows.length > 0) {
            console.log('✅ Current version found:', currentVersionCheck.rows[0]);
            return;
        }
        
        console.log('❌ No current version found. Finding latest version...');
        
        // Find the latest version
        const latestVersion = await sql`
            SELECT id, version_number 
            FROM ranking_versions 
            ORDER BY version_number DESC 
            LIMIT 1
        `;
        
        if (latestVersion.rows.length === 0) {
            console.log('❌ No versions found in database');
            return;
        }
        
        const latest = latestVersion.rows[0];
        console.log('📝 Latest version found:', latest);
        
        // Check if this version has players
        const playerCount = await sql`
            SELECT COUNT(*) as count 
            FROM players 
            WHERE version_id = ${latest.id}
        `;
        
        console.log('👥 Players in latest version:', playerCount.rows[0].count);
        
        if (parseInt(playerCount.rows[0].count) === 0) {
            console.log('❌ Latest version has no players. Looking for previous version with data...');
            
            // Find the most recent version with players
            const versionWithPlayers = await sql`
                SELECT v.id, v.version_number, COUNT(p.id) as player_count
                FROM ranking_versions v
                LEFT JOIN players p ON v.id = p.version_id
                GROUP BY v.id, v.version_number
                HAVING COUNT(p.id) > 0
                ORDER BY v.version_number DESC
                LIMIT 1
            `;
            
            if (versionWithPlayers.rows.length === 0) {
                console.log('❌ No versions with players found');
                return;
            }
            
            const workingVersion = versionWithPlayers.rows[0];
            console.log('✅ Found version with players:', workingVersion);
            
            // Set this version as current
            await sql`
                UPDATE ranking_versions 
                SET is_current = TRUE 
                WHERE id = ${workingVersion.id}
            `;
            
            console.log('✅ Restored current version to:', workingVersion.version_number);
        } else {
            // Latest version has players, set it as current
            await sql`
                UPDATE ranking_versions 
                SET is_current = TRUE 
                WHERE id = ${latest.id}
            `;
            
            console.log('✅ Set latest version as current:', latest.version_number);
        }
        
        // Verify the fix
        const verification = await sql`
            SELECT v.version_number, v.is_current, COUNT(p.id) as player_count
            FROM ranking_versions v
            LEFT JOIN players p ON v.id = p.version_id
            WHERE v.is_current = TRUE
            GROUP BY v.id, v.version_number, v.is_current
        `;
        
        if (verification.rows.length > 0) {
            console.log('✅ Verification - Current version restored:', verification.rows[0]);
        } else {
            console.log('❌ Verification failed - still no current version');
        }
        
    } catch (error) {
        console.error('❌ Error fixing current version:', error);
    }
}

// Run the fix
fixCurrentVersion().then(() => {
    console.log('🏁 Fix current version complete');
    process.exit(0);
}).catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
});