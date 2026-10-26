// Vercel serverless entry point. Runs the Express API for every /api/* request.
// Socket.io needs a long-running server, so on Vercel the client polls for seat changes instead.
const app = require('../server/app');
const connectDB = require('../server/config/db');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    return res.status(500).json({ message: 'Could not connect to the database' });
  }
  return app(req, res);
};
