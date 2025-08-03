const { sql } = require('@vercel/postgres');
const crypto = require('crypto');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }

    // Check if password exists in database
    const passwordResult = await sql`
      SELECT id FROM edit_passwords 
      WHERE password = ${password} AND is_active = TRUE
    `;

    const isValid = passwordResult.rows.length > 0;
    let sessionToken = null;

    if (isValid) {
      // Generate session token (valid for 24 hours)
      sessionToken = crypto.randomBytes(32).toString('hex');
    }

    // Log the access attempt
    await sql`
      INSERT INTO edit_access_logs (
        ip_address, user_agent, password_attempted, success, session_token
      ) VALUES (
        ${ip}, ${userAgent}, ${password}, ${isValid}, ${sessionToken}
      )
    `;

    if (isValid) {
      // Set session cookie (24 hours = 86400 seconds) and persistent admin flag (1 year)
      res.setHeader('Set-Cookie', [
        `edit_session=${sessionToken}; HttpOnly; Path=/; Max-Age=86400; SameSite=Strict`,
        `edit_session_expires=${Date.now() + 86400000}; Path=/; Max-Age=86400; SameSite=Strict`,
        `admin_flag=true; Path=/; Max-Age=31536000; SameSite=Strict` // 1 year = 31536000 seconds
      ]);

      return res.status(200).json({ 
        success: true, 
        message: 'Authentication successful' 
      });
    } else {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid password' 
      });
    }

  } catch (error) {
    console.error('Auth login error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};