const mongoose = require('mongoose');

const theatreSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Theatre name is required'], trim: true },
    city: { type: String, required: [true, 'City is required'], trim: true },
    address: { type: String, default: '', trim: true },
    screens: { type: Number, default: 1, min: 1, max: 20 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Theatre', theatreSchema);
