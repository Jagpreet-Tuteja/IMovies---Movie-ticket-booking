const mongoose = require('mongoose');

let connection = null;

// Connects to MongoDB once and reuses the connection. On serverless platforms the
// module stays loaded between requests, so this avoids reconnecting every time.
function connectDB() {
  // MONGODB_URI is the name Vercel's MongoDB Atlas integration uses
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) return Promise.reject(new Error('Set MONGO_URI (or MONGODB_URI) to your MongoDB connection string'));

  if (!connection) {
    connection = mongoose
      .connect(uri)
      .then(() => console.log('Connected to MongoDB'))
      .catch((err) => {
        connection = null; // let the next request try again
        throw err;
      });
  }
  return connection;
}

module.exports = connectDB;
