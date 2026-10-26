const Show = require('../models/showModel');
const Movie = require('../models/movieModel');
const Theatre = require('../models/theatreModel');
const Seat = require('../models/seatModel');
const { allSeats, compareSeats, LOCK_MINUTES, MAX_SEATS_PER_BOOKING } = require('../utils/seats');
const { emitSeatUpdate } = require('../utils/socket');

const CLEANING_BUFFER_MINS = 15;

// Upcoming shows across all movies (admin)
exports.list = async (req, res) => {
  const shows = await Show.find({ startTime: { $gte: new Date() } })
    .sort({ startTime: 1 })
    .populate('movie', 'title')
    .populate('theatre', 'name city')
    .lean();
  const taken = await Seat.countTaken(shows.map((s) => s._id));
  res.json(shows.map((s) => ({ ...s, takenSeats: taken.get(String(s._id)) || 0 })));
};

exports.get = async (req, res) => {
  const show = await Show.findById(req.params.id)
    .populate('movie', 'title posterUrl durationMins language certificate')
    .populate('theatre', 'name city address');
  if (!show) return res.status(404).json({ message: 'Show not found' });
  res.json(show);
};

// Current seat map. Booked seats, seats other people are holding, and the caller's own held seats.
exports.seatMap = async (req, res) => {
  const seats = await Seat.find(Seat.activeFilter({ show: req.params.id }));
  const me = req.role === 'user' ? String(req.user._id) : null;
  const mine = seats.filter((s) => s.status === 'locked' && String(s.user) === me);

  res.json({
    booked: seats.filter((s) => s.status === 'booked').map((s) => s.seatNumber),
    locked: seats.filter((s) => s.status === 'locked' && String(s.user) !== me).map((s) => s.seatNumber),
    mine: mine.map((s) => s.seatNumber).sort(compareSeats),
    lockedUntil: mine[0]?.lockedUntil || null,
  });
};

// Temporarily holds seats for the caller while they pay. Replaces any seats they were already holding.
exports.lockSeats = async (req, res) => {
  const seats = [...new Set(req.body.seats || [])];
  if (seats.length === 0) return res.status(400).json({ message: 'Select at least one seat' });
  if (seats.length > MAX_SEATS_PER_BOOKING) {
    return res.status(400).json({ message: `You can book at most ${MAX_SEATS_PER_BOOKING} seats at once` });
  }

  const show = await Show.findById(req.params.id);
  if (!show) return res.status(404).json({ message: 'Show not found' });
  if (show.startTime < new Date()) return res.status(400).json({ message: 'This show has already started' });

  const valid = new Set(allSeats(show.rows, show.seatsPerRow));
  const invalid = seats.filter((s) => !valid.has(s));
  if (invalid.length) return res.status(400).json({ message: `Invalid seats: ${invalid.join(', ')}` });

  const now = new Date();
  // Drop the caller's previous hold and any expired holds the TTL monitor hasn't removed yet
  await Seat.deleteMany({
    show: show._id,
    status: 'locked',
    $or: [{ user: req.user._id }, { lockedUntil: { $lte: now } }],
  });

  const lockedUntil = new Date(now.getTime() + LOCK_MINUTES * 60 * 1000);
  try {
    await Seat.insertMany(
      seats.map((seatNumber) => ({ show: show._id, seatNumber, status: 'locked', user: req.user._id, lockedUntil })),
      { ordered: false }
    );
  } catch (err) {
    if (err.code !== 11000 && !err.writeErrors) throw err;
    // Someone else has at least one of these seats: undo the part of this hold that succeeded
    await Seat.deleteMany({ show: show._id, user: req.user._id, status: 'locked' });
    const taken = (await Seat.find({ show: show._id, seatNumber: { $in: seats } })).map((s) => s.seatNumber);
    emitSeatUpdate(show._id);
    return res.status(409).json({
      message: `Sorry, ${taken.sort(compareSeats).join(', ')} ${taken.length === 1 ? 'was' : 'were'} just taken`,
      takenSeats: taken,
    });
  }

  emitSeatUpdate(show._id);
  res.json({ seats: seats.sort(compareSeats), lockedUntil });
};

exports.releaseSeats = async (req, res) => {
  await Seat.deleteMany({ show: req.params.id, user: req.user._id, status: 'locked' });
  emitSeatUpdate(req.params.id);
  res.json({ message: 'Seats released' });
};

exports.create = async (req, res) => {
  const { movie: movieId, theatre: theatreId, screen, startTime, price, rows, seatsPerRow } = req.body;
  const [movie, theatre] = await Promise.all([Movie.findById(movieId), Theatre.findById(theatreId)]);
  if (!movie) return res.status(400).json({ message: 'Movie does not exist' });
  if (!theatre) return res.status(400).json({ message: 'Theatre does not exist' });

  const screenNo = Number(screen);
  if (!Number.isInteger(screenNo) || screenNo < 1 || screenNo > theatre.screens) {
    return res.status(400).json({ message: `${theatre.name} has screens 1 to ${theatre.screens}` });
  }

  const start = new Date(startTime);
  if (Number.isNaN(start.getTime()) || start < new Date()) {
    return res.status(400).json({ message: 'Start time must be in the future' });
  }

  // Make sure the screen is free for the whole movie plus cleaning time
  const minutes = (m) => (m + CLEANING_BUFFER_MINS) * 60 * 1000;
  const end = new Date(start.getTime() + minutes(movie.durationMins));
  const nearby = await Show.find({
    theatre: theatre._id,
    screen: screenNo,
    startTime: { $gt: new Date(start.getTime() - 24 * 60 * 60 * 1000), $lt: end },
  }).populate('movie', 'title durationMins');
  const clash = nearby.find((s) => s.startTime.getTime() + minutes(s.movie?.durationMins || 0) > start.getTime());
  if (clash) {
    return res.status(409).json({
      message: `Screen ${screenNo} is busy with ${clash.movie?.title || 'another show'} at that time`,
    });
  }

  const show = await Show.create({
    movie: movie._id,
    theatre: theatre._id,
    screen: screenNo,
    startTime: start,
    price,
    rows,
    seatsPerRow,
  });
  res.status(201).json(show);
};

exports.remove = async (req, res) => {
  if (await Seat.exists({ show: req.params.id, status: 'booked' })) {
    return res.status(400).json({ message: 'This show has bookings. Cancel them before deleting it.' });
  }
  const show = await Show.findByIdAndDelete(req.params.id);
  if (!show) return res.status(404).json({ message: 'Show not found' });
  await Seat.deleteMany({ show: show._id });
  emitSeatUpdate(show._id);
  res.json({ message: 'Show deleted' });
};
