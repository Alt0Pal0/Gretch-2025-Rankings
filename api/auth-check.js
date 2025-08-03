const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get session token from cookies
    const cookies = req.headers.cookie || '';
    const sessionMatch = cookies.match(/edit_session=([^;]+)/);
    const expiresMatch = cookies.match(/edit_session_expires=([^;]+)/);
    
    if (!sessionMatch || !expiresMatch) {
      return res.status(401).json({ 
        success: false, 
        error: 'No session found' 
      });
    }

    const sessionToken = sessionMatch[1];
    const expiresTime = parseInt(expiresMatch[1]);
    
    // Check if session has expired
    if (Date.now() > expiresTime) {
      return res.status(401).json({ 
        success: false, 
        error: 'Session expired' 
      });
    }

    // Verify session token exists in database
    const sessionResult = await sql`
      SELECT COUNT(*) as count FROM edit_access_logs 
      WHERE session_token = ${sessionToken} AND success = TRUE
    `;

    if (sessionResult.rows[0].count > 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'Session valid' 
      });
    } else {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid session' 
      });
    }

  } catch (error) {
    console.error('Auth check error:', error);
    return res.status(500).json({ error: 'Session verification failed' });
  }
};