// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { sql } = require('@vercel/postgres');
const fs = require('fs');
const path = require('path');
const { migrate } = require('./migrate.js');

async function setup() {
  try {
    console.log('🚀 Starting database setup...');

    // Create database schema manually
    console.log('📋 Creating database schema...');
    
    // Drop existing tables if they exist (to start fresh)
    await sql`DROP TABLE IF EXISTS players CASCADE`;
    await sql`DROP TABLE IF EXISTS ranking_versions CASCADE`;
    
    // Create ranking_versions table
    await sql`
      CREATE TABLE ranking_versions (
        id SERIAL PRIMARY KEY,
        version_number INTEGER NOT NULL UNIQUE,
        version_date TIMESTAMP DEFAULT NOW(),
        is_current BOOLEAN DEFAULT FALSE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create players table
    await sql`
      CREATE TABLE players (
        id SERIAL PRIMARY KEY,
        version_id INTEGER REFERENCES ranking_versions(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        position VARCHAR(2) NOT NULL CHECK (position IN ('QB', 'RB', 'WR', 'TE')),
        position_rank INTEGER NOT NULL,
        nfl_team VARCHAR(3) NOT NULL CHECK (nfl_team IN (
          'ARZ','ATL','BLT','BUF','CAR','CHI','CIN','CLV','DAL','DEN',
          'DET','GB','HST','IND','JAX','KC','LA','LAC','MIA','MIN',
          'NE','NO','NYG','NYJ','OAK','PHI','PIT','SEA','SF','TB','TEN','WAS','TBD'
        )),
        bye_week INTEGER CHECK (bye_week BETWEEN 1 AND 18),
        is_bold BOOLEAN DEFAULT FALSE,
        is_italic BOOLEAN DEFAULT FALSE,
        small_tier_break BOOLEAN DEFAULT FALSE,
        big_tier_break BOOLEAN DEFAULT FALSE,
        news_copy TEXT,
        ranking_change INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_players_version_position 
      ON players(version_id, position, position_rank)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_ranking_versions_current 
      ON ranking_versions(is_current) WHERE is_current = TRUE
    `;

    // Create function to ensure only one current version
    await sql`
      CREATE OR REPLACE FUNCTION ensure_single_current_version()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.is_current = TRUE THEN
          UPDATE ranking_versions SET is_current = FALSE WHERE id != NEW.id;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `;

    // Create trigger
    await sql`
      DROP TRIGGER IF EXISTS trigger_single_current_version ON ranking_versions
    `;

    await sql`
      CREATE TRIGGER trigger_single_current_version
        AFTER INSERT OR UPDATE OF is_current ON ranking_versions
        FOR EACH ROW
        WHEN (NEW.is_current = TRUE)
        EXECUTE FUNCTION ensure_single_current_version()
    `;

    console.log('✅ Database schema created successfully');

    // Run migration to populate initial data
    console.log('📊 Running data migration...');
    await migrate();

    console.log('🎉 Setup completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Deploy to Vercel: `vercel deploy`');
    console.log('2. Visit your site to see the dynamic rankings');
    console.log('3. Access /edit_rankings to manage player data (coming in Phase 2)');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  }
}

// Run setup if called directly
if (require.main === module) {
  setup().then(() => {
    console.log('Setup finished');
    process.exit(0);
  }).catch((error) => {
    console.error('Setup error:', error);
    process.exit(1);
  });
}

module.exports = { setup };