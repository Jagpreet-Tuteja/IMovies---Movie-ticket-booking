const mongoose = require('mongoose');
const Booking = require('../models/bookingModel');
const Show = require('../models/showModel');
const Seat = require('../models/seatModel');
const Payment = require('../models/paymentModel');
const { processPayment, PAYMENT_METHODS } = require('../utils/paymentGateway');
const { compareSeats } = require('../utils/seats');
const { emitSeatUpdate } = require('../utils/socket');
const { sendMail, formatShowTime } = require('../utils/notify');

const withDetails = (query) =>
  query
    .populate({
      path: 'show',
      populate: [
        { path: 'movie', select: 'title posterUrl durationMins certificate language' },
        { path: 'theatre', select: 'name city address' },
      ],
    })
    .populate('payment', 'method status transactionId amount createdAt');

function ticketText(booking, show, heading) {
  return [
    heading,
    '',
    `Movie:    ${show.movie?.title}`,
    `Theatre:  ${show.theatre?.name}, ${show.theatre?.city} (Screen ${show.screen})`,
    `Showtime: ${formatShowTime(show.startTime)}`,
    `Seats:    ${booking.seats.join(', ')}`,
    `Amount:   Rs. ${booking.totalPrice}`,
    `Booking:  ${booking._id}`,
  ].join('\n');
}

// Pays for the seats the user is currently holding and turns them into a booking
exports.create = async (req, res) => {
  const { showId, paymentMethod, simulateFailure } = req.body;
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    return res.status(400).json({ message: 'Choose a payment method' });
  }

  const show = await Show.findById(showId).populate('movie', 'title').populate('theatre', 'name city');
  if (!show) return res.status(404).json({ message: 'Show not found' });
  if (show.startTime < new Date()) return res.status(400).json({ message: 'This show has already started' });

  const now = new Date();
  const held = await Seat.find({ show: show._id, user: req.user._id, status: 'locked', lockedUntil: { $gt: now } });
  if (held.length === 0) {
    return res.status(400).json({ message: 'Your seat hold has expired. Please select your seats again.' });
  }

  const seats = held.map((s) => s.seatNumber).sort(compareSeats);
  const amount = seats.length * show.price;
  const bookingId = new mongoose.Types.ObjectId();

  // Claim the held seats for this booking. This fails if a hold expired in the meantime.
  const claimed = await Seat.updateMany(
    { _id: { $in: held.map((s) => s._id) }, status: 'locked', lockedUntil: { $gt: now } },
    { $set: { status: 'booked', booking: bookingId }, $unset: { lockedUntil: 1 } }
  );
  if (claimed.modifiedCount !== held.length) {
    await Seat.deleteMany({ booking: bookingId });
    emitSeatUpdate(show._id);
    return res.status(409).json({ message: 'Your seat hold expired. Please select your seats again.' });
  }

  const result = await processPayment({ amount, method: paymentMethod, simulateFailure });
  if (result.status !== 'success') {
    // Failed payment: release the seats so others can book them
    await Seat.deleteMany({ booking: bookingId });
    await Payment.create({ user: req.user._id, amount, method: paymentMethod, status: 'failed', failureReason: result.reason });
    emitSeatUpdate(show._id);
    return res.status(402).json({ message: `${result.reason}. Your seats have been released.` });
  }

  const payment = await Payment.create({
    user: req.user._id,
    booking: bookingId,
    amount,
    method: paymentMethod,
    status: 'success',
    transactionId: result.transactionId,
  });
  const booking = await Booking.create({
    _id: bookingId,
    user: req.user._id,
    show: show._id,
    seats,
    totalPrice: amount,
    payment: payment._id,
  });

  emitSeatUpdate(show._id);
  sendMail({
    to: req.user.email,
    subject: `Booking confirmed: ${show.movie.title}`,
    text: ticketText(booking, show, `Hi ${req.user.name}, your tickets are confirmed!`) + `\nPayment:  ${result.transactionId}`,
  });

  res.status(201).json(await withDetails(Booking.findById(booking._id)));
};

exports.mine = async (req, res) => {
  res.json(await withDetails(Booking.find({ user: req.user._id }).sort({ createdAt: -1 })));
};

exports.getOne = async (req, res) => {
  const booking = await withDetails(Booking.findOne({ _id: req.params.id, user: req.user._id }));
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  res.json(booking);
};

// Shared by the user and admin cancel endpoints. Frees the seats and refunds the payment.
async function cancelBooking(booking) {
  booking.status = 'cancelled';
  booking.cancelledAt = new Date();
  await booking.save();
  await Seat.deleteMany({ booking: booking._id });
  if (booking.payment) await Payment.updateOne({ _id: booking.payment }, { status: 'refunded' });
  emitSeatUpdate(booking.show._id || booking.show);
}
exports.cancelBooking = cancelBooking;

exports.cancel = async (req, res) => {
  const booking = await withDetails(Booking.findOne({ _id: req.params.id, user: req.user._id }));
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (booking.status === 'cancelled') return res.status(400).json({ message: 'Booking is already cancelled' });
  if (booking.show && booking.show.startTime < new Date()) {
    return res.status(400).json({ message: 'Cannot cancel a booking for a show that has started' });
  }

  await cancelBooking(booking);
  if (booking.show) {
    sendMail({
      to: req.user.email,
      subject: `Booking cancelled: ${booking.show.movie?.title}`,
      text: ticketText(booking, booking.show, `Hi ${req.user.name}, your booking was cancelled and Rs. ${booking.totalPrice} will be refunded.`),
    });
  }
  res.json(await withDetails(Booking.findById(booking._id)));
};

exports.withDetails = withDetails;
exports.ticketText = ticketText;
