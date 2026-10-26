const Admin = require('../models/adminModel');
const User = require('../models/userModel');
const Movie = require('../models/movieModel');
const Theatre = require('../models/theatreModel');
const Show = require('../models/showModel');
const Booking = require('../models/bookingModel');
const Payment = require('../models/paymentModel');
const { signToken, publicAccount, isText } = require('../utils/token');
const { cancelBooking, withDetails, ticketText } = require('./bookingController');
const { sendMail } = require('../utils/notify');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!isText(email) || !isText(password)) return res.status(400).json({ message: 'Email and password are required' });

  const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');
  if (!admin || !(await admin.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid admin email or password' });
  }
  res.json({ token: signToken(admin, 'admin'), user: publicAccount(admin, 'admin') });
};

// Dashboard numbers and revenue report
exports.stats = async (req, res) => {
  const [users, movies, theatres, upcomingShows, bookings, revenue, byMovie, byTheatre, recent] = await Promise.all([
    User.countDocuments(),
    Movie.countDocuments(),
    Theatre.countDocuments(),
    Show.countDocuments({ startTime: { $gte: new Date() } }),
    Booking.countDocuments({ status: 'confirmed' }),
    Payment.aggregate([{ $match: { status: 'success' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    revenueBy('movie', 'movies', 'title'),
    revenueBy('theatre', 'theatres', 'name'),
    Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email')
      .populate({ path: 'show', select: 'startTime movie', populate: { path: 'movie', select: 'title' } }),
  ]);

  res.json({
    counts: { users, movies, theatres, upcomingShows, bookings },
    revenue: revenue[0]?.total || 0,
    byMovie,
    byTheatre,
    recent,
  });
};

// Revenue and tickets sold from confirmed bookings, grouped by a field of the show
function revenueBy(showField, collection, labelField) {
  return Booking.aggregate([
    { $match: { status: 'confirmed' } },
    { $lookup: { from: 'shows', localField: 'show', foreignField: '_id', as: 'show' } },
    { $unwind: '$show' },
    { $group: { _id: `$show.${showField}`, revenue: { $sum: '$totalPrice' }, tickets: { $sum: { $size: '$seats' } } } },
    { $lookup: { from: collection, localField: '_id', foreignField: '_id', as: 'ref' } },
    { $unwind: '$ref' },
    { $project: { _id: 0, name: `$ref.${labelField}`, revenue: 1, tickets: 1 } },
    { $sort: { revenue: -1 } },
  ]);
}

exports.users = async (req, res) => {
  const [users, counts] = await Promise.all([
    User.find().sort({ createdAt: -1 }).lean(),
    Booking.aggregate([{ $match: { status: 'confirmed' } }, { $group: { _id: '$user', count: { $sum: 1 } } }]),
  ]);
  const byUser = new Map(counts.map((c) => [String(c._id), c.count]));
  res.json(users.map((u) => ({ ...u, bookings: byUser.get(String(u._id)) || 0 })));
};

exports.bookings = async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  res.json(await withDetails(Booking.find(filter).sort({ createdAt: -1 }).populate('user', 'name email phone')));
};

exports.cancelBooking = async (req, res) => {
  const booking = await withDetails(Booking.findById(req.params.id).populate('user', 'name email'));
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (booking.status === 'cancelled') return res.status(400).json({ message: 'Booking is already cancelled' });

  await cancelBooking(booking);
  if (booking.user && booking.show) {
    sendMail({
      to: booking.user.email,
      subject: `Booking cancelled: ${booking.show.movie?.title}`,
      text: ticketText(
        booking,
        booking.show,
        `Hi ${booking.user.name}, your booking was cancelled by IMovies and Rs. ${booking.totalPrice} will be refunded.`
      ),
    });
  }
  res.json(booking);
};

exports.payments = async (req, res) => {
  res.json(await Payment.find().sort({ createdAt: -1 }).populate('user', 'name email'));
};
