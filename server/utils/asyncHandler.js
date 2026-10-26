// Forwards rejected promises from async controllers to the error middleware (Express 4)
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
