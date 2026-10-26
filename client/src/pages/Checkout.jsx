import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errorMessage, formatDateTime, inr, POSTER_FALLBACK } from '../api/client';
import Spinner from '../components/Spinner';

const METHODS = [
  { id: 'upi', label: 'UPI', icon: '📱', hint: 'Google Pay, PhonePe, Paytm' },
  { id: 'card', label: 'Credit / Debit card', icon: '💳', hint: 'Visa, Mastercard, RuPay' },
  { id: 'netbanking', label: 'Net banking', icon: '🏦', hint: 'All major banks' },
  { id: 'wallet', label: 'Wallet', icon: '👛', hint: 'Paytm, Amazon Pay' },
];

export default function Checkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [show, setShow] = useState(null);
  const [hold, setHold] = useState(null);
  const [method, setMethod] = useState('upi');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    Promise.all([api.get(`/shows/${id}`), api.get(`/shows/${id}/seats`)])
      .then(([s, seats]) => {
        setShow(s.data);
        setHold({ seats: seats.data.mine, lockedUntil: seats.data.lockedUntil });
      })
      .catch((err) => setError(errorMessage(err)));
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [id]);

  const pay = async () => {
    setPaying(true);
    setError('');
    try {
      const { data } = await api.post('/bookings', { showId: id, paymentMethod: method, simulateFailure });
      navigate(`/bookings/${data._id}`, { state: { justBooked: true } });
    } catch (err) {
      setError(errorMessage(err));
      setFailed(true);
      setPaying(false);
    }
  };

  const cancel = async () => {
    await api.delete(`/shows/${id}/lock`).catch(() => {});
    navigate(`/shows/${id}/seats`);
  };

  if (error && !show) return <div className="alert alert-danger">{error}</div>;
  if (!show || !hold) return <Spinner />;

  const remaining = hold.lockedUntil ? Math.max(0, new Date(hold.lockedUntil).getTime() - now) : 0;
  const expired = hold.seats.length === 0 || remaining === 0;
  const mins = Math.floor(remaining / 60000);
  const secs = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0');
  const total = hold.seats.length * show.price;

  if (failed || expired) {
    return (
      <div className="row justify-content-center">
        <div className="col-md-7">
          <div className="card shadow-sm text-center">
            <div className="card-body p-5">
              <div className="display-4 mb-2">{failed ? '❌' : '⏰'}</div>
              <h4>{failed ? 'Payment failed' : 'Your seat hold has expired'}</h4>
              <p className="text-muted">
                {failed ? error : 'Seats are held for 5 minutes. They have been released so others can book them.'}
              </p>
              <Link to={`/shows/${id}/seats`} className="btn btn-danger">
                Choose seats again
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="row g-4">
      <div className="col-lg-7">
        <div className="card shadow-sm">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <strong>Choose a payment method</strong>
            <span className={`badge ${remaining < 60000 ? 'bg-danger' : 'bg-warning text-dark'}`}>
              ⏱ Seats held for {mins}:{secs}
            </span>
          </div>
          <div className="card-body">
            <div className="d-grid gap-2">
              {METHODS.map((m) => (
                <label key={m.id} className={`pay-option border rounded p-3 d-flex align-items-center gap-3 ${method === m.id ? 'active' : ''}`}>
                  <input
                    type="radio"
                    className="form-check-input mt-0"
                    name="method"
                    checked={method === m.id}
                    onChange={() => setMethod(m.id)}
                  />
                  <span className="fs-4">{m.icon}</span>
                  <span>
                    <span className="fw-semibold d-block">{m.label}</span>
                    <small className="text-muted">{m.hint}</small>
                  </span>
                </label>
              ))}
            </div>

            <div className="alert alert-info small mt-3 mb-2">
              This is a demo payment gateway. No money is charged and no card details are needed.
            </div>
            <div className="form-check small mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="simulateFailure"
                checked={simulateFailure}
                onChange={(e) => setSimulateFailure(e.target.checked)}
              />
              <label className="form-check-label text-muted" htmlFor="simulateFailure">
                Simulate a failed payment (for testing)
              </label>
            </div>

            <div className="d-flex gap-2">
              <button className="btn btn-danger btn-lg flex-grow-1" disabled={paying} onClick={pay}>
                {paying ? 'Processing payment...' : `Pay ${inr(total)}`}
              </button>
              <button className="btn btn-outline-secondary" disabled={paying} onClick={cancel}>
                Change seats
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="col-lg-5">
        <div className="card shadow-sm">
          <div className="card-header bg-white">
            <strong>Booking summary</strong>
          </div>
          <div className="card-body">
            <div className="d-flex gap-3 mb-3">
              <img
                src={show.movie?.posterUrl || POSTER_FALLBACK}
                onError={(e) => (e.currentTarget.src = POSTER_FALLBACK)}
                alt=""
                className="rounded movie-poster"
                style={{ width: 80 }}
              />
              <div>
                <h5 className="mb-1">{show.movie?.title}</h5>
                <div className="small text-muted">
                  {show.movie?.certificate} · {show.movie?.language}
                </div>
                <div className="small">{formatDateTime(show.startTime)}</div>
                <div className="small">
                  {show.theatre?.name}, {show.theatre?.city} · Screen {show.screen}
                </div>
              </div>
            </div>
            <table className="table table-sm mb-0">
              <tbody>
                <tr>
                  <td>Seats</td>
                  <td className="text-end fw-semibold">{hold.seats.join(', ')}</td>
                </tr>
                <tr>
                  <td>
                    {hold.seats.length} × {inr(show.price)}
                  </td>
                  <td className="text-end">{inr(total)}</td>
                </tr>
                <tr className="fs-5">
                  <th>Total</th>
                  <th className="text-end">{inr(total)}</th>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
