const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Admin = require('../models/adminModel');

// Reads the Bearer token and loads the matching user or admin account
async function resolveAccount(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  const { id, role } = jwt.verify(token, process.env.JWT_SECRET);
  const account = role === 'admin' ? await Admin.findById(id) : await User.findById(id);
  return account ? { account, role } : null;
}

// Requires a logged-in account and sets req.user and req.role
async function fetchUser(req, res, next) {
  try {
    const result = await resolveAccount(req);
    if (!result) return res.status(401).json({ message: 'Please log in to continue' });
    req.user = result.account;
    req.role = result.role;
    next();
  } catch {
    res.status(401).json({ message: 'Your session has expired. Please log in again' });
  }
}

// Same as fetchUser, but lets anonymous requests through
async function optionalUser(req, res, next) {
  try {
    const result = await resolveAccount(req);
    if (result) {
      req.user = result.account;
      req.role = result.role;
    }
  } catch {
    // An invalid token is treated as anonymous here
  }
  next();
}

function userOnly(req, res, next) {
  if (req.role !== 'user') return res.status(403).json({ message: 'This action needs a customer account' });
  next();
}

function adminOnly(req, res, next) {
  if (req.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  next();
}

module.exports = { fetchUser, optionalUser, userOnly, adminOnly };
