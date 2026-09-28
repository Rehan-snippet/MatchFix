const { verify } = require('../utils/jwt');

// Attaches req.user = { user_id, name, email, roles } when a valid JWT is
// present. Every protected route uses this first.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing auth token' });
  try {
    req.user = verify(token);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Usage: router.post('/turfs', requireAuth, requireRole('organizer'), ...)
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (req.user.is_admin) return next();
    const ok = roles.some((r) => req.user.roles?.includes(r));
    if (!ok) {
      return res
        .status(403)
        .json({ error: `This action requires role: ${roles.join(' or ')}` });
    }
    next();
  };
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (!req.user.is_admin) return res.status(403).json({ error: 'Admin access required' });
  next();
}

module.exports = { requireAuth, requireRole, requireAdmin };
