const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// POST /api/users/register
async function register(req, res) {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'username, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({
      username,
      email,
      password,
      role: role === 'host' ? 'host' : 'user',
    });

    const token = generateToken(user);
    return res.status(201).json({ token, user: user.toSafeObject() });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to register user', error: err.message });
  }
}

// POST /api/users/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user);
    return res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to log in', error: err.message });
  }
}

// GET /api/users/me
async function getMe(req, res) {
  return res.json({ user: req.user.toSafeObject() });
}

module.exports = { register, login, getMe };
