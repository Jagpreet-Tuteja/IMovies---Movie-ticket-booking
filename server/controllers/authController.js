const User = require('../models/userModel');
const { signToken, publicAccount, isText } = require('../utils/token');

exports.register = async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!isText(name) || !isText(email) || !isText(password) || (phone !== undefined && typeof phone !== 'string')) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }
  if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
  if (await User.exists({ email: email.toLowerCase() })) {
    return res.status(409).json({ message: 'An account with this email already exists' });
  }

  const user = await User.create({ name, email, phone, password });
  res.status(201).json({ token: signToken(user, 'user'), user: publicAccount(user, 'user') });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!isText(email) || !isText(password)) return res.status(400).json({ message: 'Email and password are required' });

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  res.json({ token: signToken(user, 'user'), user: publicAccount(user, 'user') });
};

// JWTs are stateless, so logging out means the client discards its token
exports.logout = (req, res) => res.json({ message: 'Logged out' });

exports.me = (req, res) => res.json({ user: publicAccount(req.user, req.role) });

exports.updateProfile = async (req, res) => {
  const { name, phone, city } = req.body;
  if ([name, phone, city].some((v) => v !== undefined && typeof v !== 'string')) {
    return res.status(400).json({ message: 'Invalid profile details' });
  }
  if (name !== undefined) {
    if (!name.trim()) return res.status(400).json({ message: 'Name cannot be empty' });
    req.user.name = name;
  }
  if (phone !== undefined) req.user.phone = phone;
  if (city !== undefined) req.user.city = city;
  await req.user.save();
  res.json({ user: publicAccount(req.user, req.role) });
};
