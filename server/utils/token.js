const jwt = require('jsonwebtoken');

// role is 'user' or 'admin' and tells the auth middleware which collection to look in
exports.signToken = (account, role) =>
  jwt.sign({ id: account._id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// True for a non-empty string. Rejects objects and arrays sent in place of text fields.
exports.isText = (value) => typeof value === 'string' && value.length > 0;

exports.publicAccount =(account, role) => ({
  id: account._id,
  name: account.name,
  email: account.email,
  phone: account.phone || '',
  city: account.city || '',
  role,
});
