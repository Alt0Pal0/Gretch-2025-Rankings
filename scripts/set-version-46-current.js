// Set Version 46 as Current - Direct fix
require('dotenv').config({ path: '.env.local' });

const { sql } = require('@vercel/postgres');

async function setVersion46Current() {
    try {
        console.log('🔍 Setting version 46 as current...');
        
        // First, check if version 46 exists
        const version46Check = await sql`
            SELECT id, version_number, is_current 
            FROM ranking_versions 
            WHERE version_number = 46
        `;
        
        if (version46Check.rows.length === 0) {
            console.log('❌ Version 46 not found in database');
            
            // Show available versions
            const allVersions = await sql`
                SELECT version_number, is_current, COUNT(p.id) as player_count
                FROM ranking_versions v
                LEFT JOIN players p ON v.id = p.version_id
                GROUP BY v.id, v.version_number, v.is_current
                ORDER BY v.version_number DESC
                LIMIT 10
            `;
            
            console.log('📋 Available versions:');
            allVersions.rows.forEach(v => {
                console.log(`   Version ${v.version_number}: ${v.player_count} players, current: ${v.is_current}`);
            });
            return;
        }
        
        const version46 = version46Check.rows[0];
        console.log('✅ Version 46 found:', version46);
        
        // Check how many players are in version 46
        const playerCount = await sql`
            SELECT COUNT(*) as count 
            FROM players 
            WHERE version_id = ${version46.id}
        `;
        
        console.log(`👥 Players in version 46: ${playerCount.rows[0].count}`);
        
        if (parseInt(playerCount.rows[0].count) === 0) {
            console.log('⚠️  Version 46 has no players!');
        }
        
        // Clear all current flags first
        await sql`
            UPDATE ranking_versions 
            SET is_current = FALSE
        `;
        
        console.log('🧹 Cleared all current flags');
        
        // Set version 46 as current
        await sql`
            UPDATE ranking_versions 
            SET is_current = TRUE 
            WHERE version_number = 46
        `;
        
        console.log('✅ Set version 46 as current');
        
        // Verify the fix
        const verification = await sql`
            SELECT v.version_number, v.is_current, COUNT(p.id) as player_count
            FROM ranking_versions v
            LEFT JOIN players p ON v.id = p.version_id
            WHERE v.is_current = TRUE
            GROUP BY v.id, v.version_number, v.is_current
        `;
        
        if (verification.rows.length > 0) {
            console.log('✅ Verification - Current version is now:', verification.rows[0]);
            
            if (parseInt(verification.rows[0].player_count) > 0) {
                console.log('🎉 Success! Version 46 is current and has player data');
            } else {
                console.log('⚠️  Version 46 is current but has no players');
            }
        } else {
            console.log('❌ Verification failed - no current version found');
        }
        
    } catch (error) {
        console.error('❌ Error setting version 46 as current:', error);
    }
}

// Run the fix
setVersion46Current().then(() => {
    console.log('🏁 Set version 46 current complete');
    process.exit(0);
}).catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
});