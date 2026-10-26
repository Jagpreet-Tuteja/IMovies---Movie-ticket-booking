const nodemailer = require('nodemailer');

const transporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

// Sends an email notification. Without SMTP settings the email is printed to the console instead.
// Never throws, so a mail problem can't break a booking.
async function sendMail({ to, subject, text }) {
  if (!transporter) {
    console.log(`\n[email] To: ${to}\n[email] Subject: ${subject}\n${text}\n`);
    return;
  }
  try {
    await transporter.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, text });
  } catch (err) {
    console.error('[email] Failed to send:', err.message);
  }
}

const formatShowTime = (date) =>
  new Date(date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' });

module.exports = { sendMail, formatShowTime };
