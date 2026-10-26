const mongoose = require('mongoose');

let connection = null;

// Connects to MongoDB once and reuses the connection. On serverless platforms the
// module stays loaded between requests, so this avoids reconnecting every time.
function connectDB() {
  if (!connection) {
    connection = mongoose
      .connect(process.env.MONGO_URI)
      .then(() => console.log('Connected to MongoDB'))
      .catch((err) => {
        connection = null; // let the next request try again
        throw err;
      });
  }
  return connection;
}

module.exports = connectDB;
