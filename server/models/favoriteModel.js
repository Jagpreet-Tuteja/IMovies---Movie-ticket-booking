const mongoose = require('mongoose');

// A movie on a user's watchlist
const favoriteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  },
  { timestamps: true }
);

favoriteSchema.index({ user: 1, movie: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
