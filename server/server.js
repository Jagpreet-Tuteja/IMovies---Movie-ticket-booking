require('dotenv').config();
const http = require('http');
const app = require('./app');
const prepareServer = require('./startup');
const { initSocket } = require('./utils/socket');

// Socket.io shares the HTTP server with Express for live seat updates
const server = http.createServer(app);
initSocket(server, process.env.CLIENT_ORIGIN || 'http://localhost:5173');

const PORT = process.env.PORT || 8000;
prepareServer()
  .then(() => {
    server.listen(PORT, () => console.log(`IMovies server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Startup failed:', err.message);
    process.exit(1);
  });
