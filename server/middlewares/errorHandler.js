function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Turns any thrown error into a JSON response with a sensible status code
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(', ') });
  }
  if (err.name === 'CastError') return res.status(400).json({ message: `Invalid ${err.path}: ${err.value}` });
  if (err.code === 11000) return res.status(409).json({ message: 'That record already exists' });

  // Client errors from Express itself (bad JSON, body too large) carry a 4xx status
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ message: status < 500 ? err.message : 'Something went wrong on the server' });
}

module.exports = { notFound, errorHandler };
