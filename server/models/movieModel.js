const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true },
    description: { type: String, default: '' },
    genres: [{ type: String, trim: true }],
    language: { type: String, default: 'English', trim: true },
    durationMins: { type: Number, required: [true, 'Duration is required'], min: 1 },
    certificate: { type: String, enum: ['U', 'UA', 'A', 'S'], default: 'UA' },
    cast: [{ type: String, trim: true }],
    director: { type: String, default: '', trim: true },
    posterUrl: { type: String, default: '' },
    releaseDate: { type: Date },
    // Kept in sync by the review controller so movies can be filtered and sorted by rating
    avgRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Movie', movieSchema);
