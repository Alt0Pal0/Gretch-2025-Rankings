require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function viewAuditLogs() {
  try {
    console.log('📋 Edit Rankings Access Audit Log\n');
    
    // Get recent access attempts
    const result = await sql`
      SELECT 
        timestamp,
        ip_address,
        user_agent,
        password_attempted,
        success,
        session_token
      FROM edit_access_logs 
      ORDER BY timestamp DESC 
      LIMIT 20
    `;
    
    if (result.rows.length === 0) {
      console.log('No access attempts recorded yet.');
      return;
    }
    
    console.log('Recent Access Attempts:');
    console.log('='.repeat(120));
    
    result.rows.forEach((log, index) => {
      const timestamp = new Date(log.timestamp).toLocaleString();
      const status = log.success ? '✅ SUCCESS' : '❌ FAILED';
      const ip = log.ip_address || 'unknown';
      const password = log.password_attempted || 'none';
      const userAgent = (log.user_agent || 'unknown').substring(0, 60) + '...';
      
      console.log(`\n${index + 1}. ${timestamp} | ${status}`);
      console.log(`   IP: ${ip}`);
      console.log(`   Password: "${password}"`);
      console.log(`   User Agent: ${userAgent}`);
      if (log.session_token) {
        console.log(`   Session: ${log.session_token.substring(0, 12)}...`);
      }
    });
    
    // Summary stats
    const successCount = result.rows.filter(r => r.success).length;
    const failureCount = result.rows.filter(r => !r.success).length;
    
    console.log('\n' + '='.repeat(120));
    console.log(`📊 Summary: ${successCount} successful, ${failureCount} failed attempts`);
    
  } catch (error) {
    console.error('❌ Error viewing audit logs:', error);
    process.exit(1);
  }
}

viewAuditLogs();