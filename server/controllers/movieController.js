const Movie = require('../models/movieModel');
const Show = require('../models/showModel');
const Seat = require('../models/seatModel');
const Theatre = require('../models/theatreModel');
const Review = require('../models/reviewModel');
const Favorite = require('../models/favoriteModel');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const theatreIdsInCity = (city) => Theatre.find({ city }).distinct('_id');

// GET /api/movies?search=&genre=&language=&minRating=&city=
exports.list = async (req, res) => {
  // Filters are plain text; anything else (arrays, objects) is ignored
  const { search, genre, language, minRating, city } = Object.fromEntries(
    Object.entries(req.query).filter(([, v]) => typeof v === 'string')
  );
  const filter = {};
  if (search) filter.title = { $regex: escapeRegex(search), $options: 'i' };
  if (genre) filter.genres = genre;
  if (language) filter.language = language;
  if (minRating) filter.avgRating = { $gte: Number(minRating) };
  if (city) {
    // Only movies with upcoming shows in that city
    const theatres = await theatreIdsInCity(city);
    filter._id = { $in: await Show.distinct('movie', { theatre: { $in: theatres }, startTime: { $gte: new Date() } }) };
  }
  res.json(await Movie.find(filter).sort({ releaseDate: -1 }));
};

// Values for the filter dropdowns
exports.filters = async (req, res) => {
  const [genres, languages, cities] = await Promise.all([
    Movie.distinct('genres'),
    Movie.distinct('language'),
    Theatre.distinct('city'),
  ]);
  res.json({ genres: genres.sort(), languages: languages.sort(), cities: cities.sort() });
};

exports.get = async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) return res.status(404).json({ message: 'Movie not found' });
  res.json(movie);
};

// Upcoming shows for a movie with live seat counts, optionally limited to one city
exports.shows = async (req, res) => {
  const filter = { movie: req.params.id, startTime: { $gte: new Date() } };
  if (typeof req.query.city === 'string' && req.query.city) filter.theatre = { $in: await theatreIdsInCity(req.query.city) };

  const shows = await Show.find(filter).sort({ startTime: 1 }).populate('theatre', 'name city address');
  const taken = await Seat.countTaken(shows.map((s) => s._id));
  res.json(
    shows.map((s) => {
      const totalSeats = s.rows * s.seatsPerRow;
      return {
        _id: s._id,
        theatre: s.theatre,
        screen: s.screen,
        startTime: s.startTime,
        price: s.price,
        totalSeats,
        availableSeats: totalSeats - (taken.get(String(s._id)) || 0),
      };
    })
  );
};

// Ratings are calculated from reviews, so they can't be set directly
const editableFields = ({ avgRating, reviewCount, ...fields }) => fields; // eslint-disable-line no-unused-vars

exports.create = async (req, res) => {
  res.status(201).json(await Movie.create(editableFields(req.body)));
};

exports.update = async (req, res) => {
  const changes = editableFields(req.body);
  const movie = await Movie.findByIdAndUpdate(req.params.id, changes, { new: true, runValidators: true });
  if (!movie) return res.status(404).json({ message: 'Movie not found' });
  res.json(movie);
};

exports.remove = async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) return res.status(404).json({ message: 'Movie not found' });

  const showIds = await Show.find({ movie: movie._id }).distinct('_id');
  const upcomingIds = await Show.find({ movie: movie._id, startTime: { $gte: new Date() } }).distinct('_id');
  if (await Seat.exists({ show: { $in: upcomingIds }, status: 'booked' })) {
    return res.status(400).json({ message: 'This movie has upcoming bookings. Cancel them before deleting it.' });
  }

  await Promise.all([
    Seat.deleteMany({ show: { $in: showIds } }),
    Show.deleteMany({ movie: movie._id }),
    Review.deleteMany({ movie: movie._id }),
    Favorite.deleteMany({ movie: movie._id }),
    movie.deleteOne(),
  ]);
  res.json({ message: 'Movie deleted' });
};
