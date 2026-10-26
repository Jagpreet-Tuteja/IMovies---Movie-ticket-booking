const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const sanitize = require('./middlewares/sanitize');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

// The Express app on its own, so it can run as a normal server (server.js)
// or as a serverless function (api/index.js for Vercel)
const app = express();

app.set('trust proxy', 1); // behind Vercel's proxy, so rate limits see the real client IP
app.use(helmet()); // secure HTTP headers
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '20kb' })); // Express's built-in body parser
app.use(sanitize);

const limiter = (windowMinutes, limit, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message },
  });

// Slows down password guessing and mass sign-ups
app.use(
  ['/api/auth/login', '/api/auth/register', '/api/admin/login'],
  limiter(15, 20, 'Too many attempts. Please wait 15 minutes and try again.')
);
app.use('/api', limiter(1, 300, 'Too many requests. Please slow down.'));

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

module.exports = app;
