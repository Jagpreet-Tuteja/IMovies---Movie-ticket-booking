const mongoose = require('mongoose');
const passwordPlugin = require('../utils/passwordPlugin');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    password: { type: String, required: true, minlength: 6, select: false },
  },
  { timestamps: true }
);

userSchema.plugin(passwordPlugin);

module.exports = mongoose.model('User', userSchema);
