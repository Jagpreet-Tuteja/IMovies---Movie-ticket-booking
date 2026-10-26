import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage, formatDateTime, inr, POSTER_FALLBACK } from '../api/client';
import Spinner from '../components/Spinner';

const TABS = {
  upcoming: (b, now) => b.status === 'confirmed' && b.show && new Date(b.show.startTime) > now,
  past: (b, now) => b.status === 'confirmed' && (!b.show || new Date(b.show.startTime) <= now),
  cancelled: (b) => b.status === 'cancelled',
};

export default function MyBookings() {
  const [bookings, setBookings] = useState(null);
  const [tab, setTab] = useState('upcoming');
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/bookings/me')
      .then((res) => setBookings(res.data))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  const cancel = async (id) => {
    if (!window.confirm('Cancel this booking? The seats will be released and the amount refunded.')) return;
    try {
      const { data } = await api.patch(`/bookings/${id}/cancel`);
      setBookings((prev) => prev.map((b) => (b._id === id ? data : b)));
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (!bookings && !error) return <Spinner />;

  const now = new Date();
  const visible = (bookings || []).filter((b) => TABS[tab](b, now));

  return (
    <>
      <h2 className="mb-3">My Bookings</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <ul className="nav nav-pills mb-3">
        {Object.keys(TABS).map((t) => (
          <li className="nav-item" key={t}>
            <button className={`nav-link text-capitalize ${tab === t ? 'active bg-danger' : 'text-dark'}`} onClick={() => setTab(t)}>
              {t} <span className="badge bg-light text-dark ms-1">{(bookings || []).filter((b) => TABS[t](b, now)).length}</span>
            </button>
          </li>
        ))}
      </ul>

      {visible.length === 0 && (
        <p className="text-muted">
          No {tab} bookings. <Link to="/">Browse movies</Link>
        </p>
      )}

      <div className="row g-3">
        {visible.map((b) => (
          <div className="col-md-6" key={b._id}>
            <div className={`card shadow-sm h-100 ${b.status === 'cancelled' ? 'opacity-75' : ''}`}>
              <div className="row g-0 h-100">
                <div className="col-3">
                  <img
                    src={b.show?.movie?.posterUrl || POSTER_FALLBACK}
                    onError={(e) => (e.currentTarget.src = POSTER_FALLBACK)}
                    className="img-fluid rounded-start h-100 movie-poster"
                    alt=""
                  />
                </div>
                <div className="col-9">
                  <div className="card-body">
                    <h5 className="card-title mb-1">{b.show?.movie?.title || 'Show removed'}</h5>
                    {b.show && (
                      <p className="small text-muted mb-2">
                        {formatDateTime(b.show.startTime)}
                        <br />
                        {b.show.theatre?.name}, {b.show.theatre?.city} · Screen {b.show.screen}
                      </p>
                    )}
                    <p className="mb-2">
                      Seats <strong>{b.seats.join(', ')}</strong> · {inr(b.totalPrice)}
                      {b.payment?.status === 'refunded' && <span className="badge bg-info-subtle text-info-emphasis ms-2">Refunded</span>}
                    </p>
                    <div className="d-flex flex-wrap gap-2">
                      <Link to={`/bookings/${b._id}`} className="btn btn-sm btn-outline-dark">
                        View ticket
                      </Link>
                      {tab === 'upcoming' && (
                        <button className="btn btn-sm btn-outline-danger" onClick={() => cancel(b._id)}>
                          Cancel
                        </button>
                      )}
                      {tab === 'past' && b.show?.movie && (
                        <Link to={`/movies/${b.show.movie._id}#reviews`} className="btn btn-sm btn-outline-warning">
                          ★ Write a review
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
