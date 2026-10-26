const crypto = require('crypto');

const PAYMENT_METHODS = ['upi', 'card', 'netbanking', 'wallet'];

// Simulated payment gateway. In production, replace this with Razorpay or Stripe:
// create an order on the gateway, let the client pay, then verify the signature here.
async function processPayment({ amount, method, simulateFailure }) {
  if (!PAYMENT_METHODS.includes(method)) return { status: 'failed', reason: 'Unsupported payment method' };
  if (!(amount > 0)) return { status: 'failed', reason: 'Invalid amount' };
  if (simulateFailure) return { status: 'failed', reason: 'Payment was declined by the bank (simulated)' };
  return { status: 'success', transactionId: 'TXN' + crypto.randomBytes(6).toString('hex').toUpperCase() };
}

module.exports = { processPayment, PAYMENT_METHODS };
