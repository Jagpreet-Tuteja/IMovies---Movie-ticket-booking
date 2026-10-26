// Removes keys that start with "$" or contain "." from user input, so request data can never
// become a MongoDB query operator (NoSQL injection such as {"email": {"$ne": null}})
function clean(value) {
  if (Array.isArray(value)) {
    value.forEach(clean);
  } else if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('.')) delete value[key];
      else clean(value[key]);
    }
  }
}

module.exports = function sanitize(req, res, next) {
  clean(req.body);
  clean(req.query);
  clean(req.params);
  next();
};
