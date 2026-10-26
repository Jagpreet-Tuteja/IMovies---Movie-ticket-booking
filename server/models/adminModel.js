const mongoose = require('mongoose');
const passwordPlugin = require('../utils/passwordPlugin');

// Admins live in their own collection and log in through /api/admin/login
const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
  },
  { timestamps: true }
);

adminSchema.plugin(passwordPlugin);

module.exports = mongoose.model('Admin', adminSchema);
