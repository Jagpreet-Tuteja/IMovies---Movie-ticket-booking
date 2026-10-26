const crypto = require('crypto');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Admin = require('./models/adminModel');
const { seedIfEmpty, scheduleUpcomingShows, ADMIN_EMAIL } = require('./seed');

// Without JWT_SECRET (for example on a fresh Vercel deployment), generate a strong secret once
// and keep it in the database, so every server instance signs tokens with the same secret
async function ensureJwtSecret() {
  if (process.env.JWT_SECRET) return;
  const settings = mongoose.connection.db.collection('settings');
  try {
    await settings.updateOne(
      { _id: 'jwtSecret' },
      { $setOnInsert: { value: crypto.randomBytes(48).toString('hex') } },
      { upsert: true }
    );
  } catch (err) {
    if (err.code !== 11000) throw err; // another instance created it at the same moment
  }
  process.env.JWT_SECRET = (await settings.findOne({ _id: 'jwtSecret' })).value;
}

// Keeps the admin login in step with ADMIN_PASSWORD, so it can be set or changed from the hosting dashboard
async function syncAdminPassword() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return;
  const admin = await Admin.findOne({ email: ADMIN_EMAIL }).select('+password');
  if (admin && !(await admin.matchPassword(password))) {
    admin.password = password;
    await admin.save();
  }
}

// Everything the server needs before handling requests. Runs once per process (or serverless instance).
let ready = null;
function prepareServer() {
  if (!ready) {
    ready = (async () => {
      await connectDB();
      await ensureJwtSecret();
      await seedIfEmpty();
      await Promise.all([scheduleUpcomingShows(), syncAdminPassword()]);
    })().catch((err) => {
      ready = null; // let the next request try again
      throw err;
    });
  }
  return ready;
}

module.exports = prepareServer;
