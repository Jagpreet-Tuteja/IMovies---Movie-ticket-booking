const mongoose = require('mongoose');
const Review = require('../models/reviewModel');
const Movie = require('../models/movieModel');

// Recomputes the cached average rating on the movie
async function refreshMovieRating(movieId) {
  const [stats] = await Review.aggregate([
    { $match: { movie: new mongoose.Types.ObjectId(String(movieId)) } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Movie.updateOne(
    { _id: movieId },
    { avgRating: stats ? Math.round(stats.avg * 10) / 10 : 0, reviewCount: stats?.count || 0 }
  );
}

exports.forMovie = async (req, res) => {
  res.json(await Review.find({ movie: req.params.movieId }).sort({ updatedAt: -1 }).populate('user', 'name'));
};

// Creates the user's review for a movie, or updates it if they already wrote one
exports.upsert = async (req, res) => {
  const { movieId, comment } = req.body;
  const rating = Number(req.body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5 stars' });
  }
  if (!(await Movie.exists({ _id: movieId }))) return res.status(404).json({ message: 'Movie not found' });

  const review = await Review.findOneAndUpdate(
    { user: req.user._id, movie: movieId },
    { rating, comment },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  ).populate('user', 'name');
  await refreshMovieRating(movieId);
  res.status(201).json(review);
};

// Users can delete their own review; admins can delete any review (moderation)
exports.remove = async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ message: 'Review not found' });
  if (req.role !== 'admin' && !review.user.equals(req.user._id)) {
    return res.status(403).json({ message: 'You can only delete your own review' });
  }
  await review.deleteOne();
  await refreshMovieRating(review.movie);
  res.json({ message: 'Review deleted' });
};

exports.all = async (req, res) => {
  res.json(
    await Review.find().sort({ createdAt: -1 }).populate('user', 'name email').populate('movie', 'title')
  );
};

exports.refreshMovieRating = refreshMovieRating;
