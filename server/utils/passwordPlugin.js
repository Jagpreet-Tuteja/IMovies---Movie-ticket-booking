const bcrypt = require('bcryptjs');

// Adds password hashing and comparison to account schemas (User, Admin)
module.exports = function passwordPlugin(schema) {
  schema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
  });

  schema.methods.matchPassword = function (candidate) {
    return bcrypt.compare(candidate, this.password);
  };
};
