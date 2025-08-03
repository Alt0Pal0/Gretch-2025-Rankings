require('dotenv').config();
const { sql } = require('@vercel/postgres');
const fs = require('fs');
const path = require('path');

async function setupAnalytics() {
    console.log('🔧 Setting up analytics tracking...\n');

    try {
        // Read and execute analytics schema
        const schemaPath = path.join(__dirname, '..', 'db', 'analytics-schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Execute the full schema (PostgreSQL can handle multiple statements)
        console.log('Executing analytics schema...');
        await sql`${schema}`;

        console.log('\n✅ Analytics schema created successfully!');
        console.log('📊 Ready to track:');
        console.log('   • Page views with IP/User-Agent');
        console.log('   • Unique visitors');
        console.log('   • Daily aggregated stats');
        console.log('   • Automatic daily stats updates');

    } catch (error) {
        console.error('❌ Failed to setup analytics:', error.message);
        throw error;
    } finally {
        process.exit(0);
    }
}

setupAnalytics();