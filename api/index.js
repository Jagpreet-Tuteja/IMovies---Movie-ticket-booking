// Vercel serverless entry point. Runs the Express API for every /api/* request.
// Socket.io needs a long-running server, so on Vercel the client polls for seat changes instead.
const app = require('../server/app');
const prepareServer = require('../server/startup');

module.exports = async (req, res) => {
  try {
    // Connects to the database, fills it with sample data if empty, keeps shows scheduled
    await prepareServer();
  } catch (err) {
    console.error('Startup failed:', err.message);
    return res.status(503).json({ message: 'The server is not ready yet. Please try again shortly.' });
  }
  return app(req, res);
};
