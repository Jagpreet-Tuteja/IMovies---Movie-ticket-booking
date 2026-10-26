// Vercel serverless entry point. Runs the Express API for every /api/* request.
// Socket.io needs a long-running server, so on Vercel the client polls for seat changes instead.
const app = require('../server/app');
const connectDB = require('../server/config/db');
const { seedIfEmpty, scheduleUpcomingShows } = require('../server/seed');

// Once per function instance: fill a brand-new database with sample data,
// and keep a week of shows scheduled so the live demo stays bookable
let demoDataReady = null;
function prepareDemoData() {
  if (!demoDataReady) {
    demoDataReady = seedIfEmpty()
      .then(() => scheduleUpcomingShows())
      .catch((err) => {
        demoDataReady = null;
        console.error('Demo data setup failed:', err.message);
      });
  }
  return demoDataReady;
}

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    return res.status(500).json({ message: 'Could not connect to the database' });
  }
  await prepareDemoData();
  return app(req, res);
};
