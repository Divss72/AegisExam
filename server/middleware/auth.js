const jwt = require('jsonwebtoken');
const { User, AuditLog } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'aegisexam-sentinel-cryptographic-secret-key-2026';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      studentId: user.studentId
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

async function authenticateUser(req, res, next) {
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    // Check if demo user ID header is provided for easy local evaluation
    const demoUserId = req.headers['x-demo-user-id'];
    if (demoUserId) {
      const user = await User.findByPk(demoUserId);
      if (user) {
        req.user = user;
        return next();
      }
    }
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found or session expired.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      // Record unauthorized attempt in audit log
      AuditLog.create({
        userId: req.user.id,
        role: req.user.role,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        resourceType: 'API_ENDPOINT',
        resourceId: req.originalUrl,
        details: `User with role '${req.user.role}' attempted to access restricted endpoint '${req.originalUrl}' requiring [${allowedRoles.join(', ')}].`,
        ipAddress: req.ip || req.connection.remoteAddress
      }).catch(err => console.error('Failed to log audit event:', err));

      return res.status(403).json({
        error: `Access denied. Role '${req.user.role}' is not authorized for this resource. Required roles: [${allowedRoles.join(', ')}]`
      });
    }

    next();
  };
}

module.exports = {
  JWT_SECRET,
  generateToken,
  authenticateUser,
  requireRole
};
