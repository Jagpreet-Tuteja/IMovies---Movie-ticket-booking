const Favorite = require('../models/favoriteModel');
const Movie = require('../models/movieModel');

// The user's watchlist as a list of movies, newest first
exports.mine = async (req, res) => {
  const favorites = await Favorite.find({ user: req.user._id }).sort({ createdAt: -1 }).populate('movie');
  res.json(favorites.map((f) => f.movie).filter(Boolean));
};

exports.add = async (req, res) => {
  if (!(await Movie.exists({ _id: req.params.movieId }))) {
    return res.status(404).json({ message: 'Movie not found' });
  }
  await Favorite.updateOne({ user: req.user._id, movie: req.params.movieId }, {}, { upsert: true });
  res.status(201).json({ message: 'Added to watchlist' });
};

exports.remove = async (req, res) => {
  await Favorite.deleteOne({ user: req.user._id, movie: req.params.movieId });
  res.json({ message: 'Removed from watchlist' });
};
