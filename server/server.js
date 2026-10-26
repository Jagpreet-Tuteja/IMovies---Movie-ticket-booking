require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./utils/socket');
const { seedIfEmpty, scheduleUpcomingShows } = require('./seed');

// Socket.io shares the HTTP server with Express for live seat updates
const server = http.createServer(app);
initSocket(server, process.env.CLIENT_ORIGIN || 'http://localhost:5173');

const PORT = process.env.PORT || 8000;
connectDB()
  // Sample data for a fresh database, and a week of upcoming shows
  .then(() => seedIfEmpty())
  .then(() => scheduleUpcomingShows())
  .then(() => {
    server.listen(PORT, () => console.log(`IMovies server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
