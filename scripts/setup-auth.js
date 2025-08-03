require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');
const fs = require('fs');

async function setupAuth() {
  try {
    console.log('Setting up authentication tables...');
    
    // Create edit_passwords table
    await sql`
      CREATE TABLE IF NOT EXISTS edit_passwords (
        id SERIAL PRIMARY KEY,
        password VARCHAR(100) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Created edit_passwords table');
    
    // Create edit_access_logs table
    await sql`
      CREATE TABLE IF NOT EXISTS edit_access_logs (
        id SERIAL PRIMARY KEY,
        ip_address INET,
        user_agent TEXT,
        password_attempted VARCHAR(100),
        success BOOLEAN NOT NULL,
        session_token VARCHAR(64),
        timestamp TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Created edit_access_logs table');
    
    // Insert the passwords (only if they don't exist)
    const existingPasswords = await sql`SELECT COUNT(*) as count FROM edit_passwords`;
    
    if (existingPasswords.rows[0].count == 0) {
      await sql`
        INSERT INTO edit_passwords (password, description) VALUES 
          ('StealingBananas!', 'Primary edit access password'),
          ('B3nGr3tch!', 'Secondary edit access password')
      `;
      console.log('✅ Inserted authentication passwords');
    } else {
      console.log('✅ Passwords already exist, skipping insert');
    }
    
    console.log('\n✅ Authentication setup complete!');
    console.log('📋 Password table created with 2 passwords');
    console.log('📋 Access log table created for audit trail');
    console.log('🔐 Edit rankings page will now require authentication');
    
  } catch (error) {
    console.error('❌ Error setting up authentication:', error);
    process.exit(1);
  }
}

setupAuth();