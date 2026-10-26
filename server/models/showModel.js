const mongoose = require('mongoose');

// One screening of a movie on a screen of a theatre
const showSchema = new mongoose.Schema(
  {
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    theatre: { type: mongoose.Schema.Types.ObjectId, ref: 'Theatre', required: true },
    screen: { type: Number, required: true, min: 1 },
    startTime: { type: Date, required: true },
    price: { type: Number, required: true, min: 0 },
    rows: { type: Number, default: 8, min: 1, max: 26 },
    seatsPerRow: { type: Number, default: 12, min: 1, max: 30 },
  },
  { timestamps: true }
);

showSchema.index({ movie: 1, startTime: 1 });
showSchema.index({ theatre: 1, screen: 1, startTime: 1 });

module.exports = mongoose.model('Show', showSchema);
