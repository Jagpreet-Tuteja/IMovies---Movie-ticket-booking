const mongoose = require('mongoose');

// A seat that is taken for a show: either temporarily locked while a user pays, or booked.
// Free seats have no document. The unique index on (show, seatNumber) is what makes
// double booking impossible: two users can never hold the same seat at once.
const seatSchema = new mongoose.Schema({
  show: { type: mongoose.Schema.Types.ObjectId, ref: 'Show', required: true },
  seatNumber: { type: String, required: true },
  status: { type: String, enum: ['locked', 'booked'], required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  // Only set on locks. MongoDB's TTL monitor deletes expired locks automatically.
  lockedUntil: { type: Date },
});

seatSchema.index({ show: 1, seatNumber: 1 }, { unique: true });
seatSchema.index({ lockedUntil: 1 }, { expireAfterSeconds: 0 });

// Filter for seats that are unavailable right now. The TTL monitor runs about once a minute,
// so expired locks that haven't been deleted yet must be ignored.
seatSchema.statics.activeFilter = (extra = {}) => ({
  ...extra,
  $or: [{ status: 'booked' }, { lockedUntil: { $gt: new Date() } }],
});

// Map of showId -> number of unavailable seats
seatSchema.statics.countTaken = async function (showIds) {
  const rows = await this.aggregate([
    { $match: this.activeFilter({ show: { $in: showIds } }) },
    { $group: { _id: '$show', count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.count]));
};

module.exports = mongoose.model('Seat', seatSchema);
