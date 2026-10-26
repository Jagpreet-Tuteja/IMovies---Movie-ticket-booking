const jwt = require('jsonwebtoken');

// role is 'user' or 'admin' and tells the auth middleware which collection to look in
exports.signToken = (account, role) =>
  jwt.sign({ id: account._id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

exports.publicAccount = (account, role) => ({
  id: account._id,
  name: account.name,
  email: account.email,
  phone: account.phone || '',
  city: account.city || '',
  role,
});
