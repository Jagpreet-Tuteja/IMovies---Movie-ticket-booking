const mongoose = require('mongoose');
const { PAYMENT_METHODS } = require('../utils/paymentGateway');

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Empty for failed payments, which never create a booking
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: PAYMENT_METHODS, required: true },
    status: { type: String, enum: ['success', 'failed', 'refunded'], required: true },
    transactionId: { type: String },
    failureReason: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
