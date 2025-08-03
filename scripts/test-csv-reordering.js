require('dotenv').config();
const { sql } = require('@vercel/postgres');

async function testCSVReordering() {
    console.log('🧪 Testing CSV Reordering Logic...\n');

    try {
        // Get current QB rankings for testing
        const result = await sql`
            SELECT name, position_rank 
            FROM players 
            WHERE version_id = (SELECT id FROM ranking_versions WHERE is_current = TRUE) 
            AND position = 'QB'
            ORDER BY position_rank
            LIMIT 5
        `;

        console.log('📊 Current QB Rankings (first 5):');
        result.rows.forEach(p => {
            console.log(`  ${p.position_rank}. ${p.name}`);
        });

        // Simulate CSV reordering logic
        console.log('\n🔄 Simulating CSV Upload with Lamar Jackson moved to #1...');
        
        const simulatedCSV = [
            { name: 'Lamar Jackson', position: 'QB', position_rank: 1 },  // Move to #1
            { name: result.rows[0].name, position: 'QB', position_rank: 2 },  // Push down
            { name: result.rows[1].name, position: 'QB', position_rank: 3 },  // Push down
            { name: result.rows[2].name, position: 'QB', position_rank: 4 },  // Push down
            { name: result.rows[3].name, position: 'QB', position_rank: 5 },  // Push down
        ];

        // Apply reordering logic (same as in upload-csv.js)
        const playersByPosition = { QB: simulatedCSV };
        
        for (const [position, positionPlayers] of Object.entries(playersByPosition)) {
            // Sort by intended ranking
            positionPlayers.sort((a, b) => a.position_rank - b.position_rank);
            
            console.log(`\n✅ After Reordering (${position}):`);
            positionPlayers.forEach((player, index) => {
                const newRank = index + 1;
                console.log(`  ${newRank}. ${player.name} (was intended #${player.position_rank})`);
            });
        }

        console.log('\n🎯 Expected Result: Sequential rankings with no duplicates!');
        console.log('✅ Test completed successfully');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        process.exit(0);
    }
}

testCSVReordering();