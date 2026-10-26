import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import api, { errorMessage, formatDateTime, inr, POSTER_FALLBACK } from '../api/client';
import Spinner from '../components/Spinner';

const METHOD_LABELS = { upi: 'UPI', card: 'Card', netbanking: 'Net banking', wallet: 'Wallet' };

export default function Ticket() {
  const { id } = useParams();
  const location = useLocation();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/bookings/${id}`)
      .then((res) => setBooking(res.data))
      .catch((err) => setError(errorMessage(err)));
  }, [id]);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!booking) return <Spinner />;

  const { show, payment } = booking;
  const cancelled = booking.status === 'cancelled';

  return (
    <div className="row justify-content-center">
      <div className="col-md-8 col-lg-6">
        {location.state?.justBooked && (
          <div className="alert alert-success no-print">
            🎉 Booking confirmed! A confirmation has been sent to your email.
          </div>
        )}

        <div className={`card shadow-sm ticket ${cancelled ? 'opacity-75' : ''}`}>
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <h5 className="mb-0">🎬 IMovies ticket</h5>
              <span className={`badge ${cancelled ? 'bg-secondary' : 'bg-success'}`}>{booking.status}</span>
            </div>
            {show ? (
              <div className="d-flex gap-3 mb-3">
                <img
                  src={show.movie?.posterUrl || POSTER_FALLBACK}
                  onError={(e) => (e.currentTarget.src = POSTER_FALLBACK)}
                  alt=""
                  className="rounded movie-poster"
                  style={{ width: 90 }}
                />
                <div>
                  <h4 className="mb-1">{show.movie?.title}</h4>
                  <div className="text-muted small mb-1">
                    {show.movie?.certificate} · {show.movie?.language}
                  </div>
                  <div className="fw-semibold">{formatDateTime(show.startTime)}</div>
                  <div>{show.theatre?.name}</div>
                  <div className="small text-muted">{show.theatre?.address}</div>
                </div>
              </div>
            ) : (
              <p className="text-muted">This show is no longer available.</p>
            )}

            <div className="row text-center border-top border-bottom py-3 mb-3 g-0">
              <div className="col">
                <div className="small text-muted">Screen</div>
                <div className="fs-5 fw-semibold">{show?.screen ?? '-'}</div>
              </div>
              <div className="col">
                <div className="small text-muted">Seats</div>
                <div className="fs-5 fw-semibold">{booking.seats.join(', ')}</div>
              </div>
              <div className="col">
                <div className="small text-muted">Amount</div>
                <div className="fs-5 fw-semibold">{inr(booking.totalPrice)}</div>
              </div>
            </div>

            <dl className="row small mb-0">
              <dt className="col-5 text-muted fw-normal">Booking ID</dt>
              <dd className="col-7 font-monospace">{booking._id}</dd>
              <dt className="col-5 text-muted fw-normal">Booked on</dt>
              <dd className="col-7">{formatDateTime(booking.createdAt)}</dd>
              {payment && (
                <>
                  <dt className="col-5 text-muted fw-normal">Payment</dt>
                  <dd className="col-7">
                    {METHOD_LABELS[payment.method]} · {payment.status}
                  </dd>
                  <dt className="col-5 text-muted fw-normal">Transaction ID</dt>
                  <dd className="col-7 font-monospace">{payment.transactionId}</dd>
                </>
              )}
            </dl>
          </div>
        </div>

        <div className="d-flex gap-2 mt-3 no-print">
          <Link to="/bookings" className="btn btn-outline-secondary">
            ← My bookings
          </Link>
          {!cancelled && (
            <button className="btn btn-danger" onClick={() => window.print()}>
              Print ticket
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
