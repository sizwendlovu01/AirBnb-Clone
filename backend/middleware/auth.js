const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifies the Bearer JWT and attaches the authenticated user to req.user
async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user no longer exists' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, invalid or expired token' });
  }
}

// Restricts a route to users with role === 'host'
function requireHost(req, res, next) {
  if (!req.user || req.user.role !== 'host') {
    return res.status(403).json({ message: 'Only hosts can perform this action' });
  }
  next();
}

module.exports = { protect, requireHost };
