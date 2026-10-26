require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { initSocket } = require('./utils/socket');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json()); // Express's built-in body parser

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/movies', require('./routes/movieRoutes'));
app.use('/api/theatres', require('./routes/theatreRoutes'));
app.use('/api/shows', require('./routes/showRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/favorites', require('./routes/favoriteRoutes'));

app.use(notFound);
app.use(errorHandler);

// Socket.io shares the HTTP server with Express for live seat updates
const server = http.createServer(app);
initSocket(server, CLIENT_ORIGIN);

const PORT = process.env.PORT || 8000;
connectDB().then(() => {
  server.listen(PORT, () => console.log(`IMovies server running on http://localhost:${PORT}`));
});
