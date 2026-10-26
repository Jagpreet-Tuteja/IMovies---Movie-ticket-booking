import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errorMessage, formatDay, formatTime, inr, POSTER_FALLBACK } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import Stars from '../components/Stars';

export default function MovieDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isCustomer = user?.role === 'user';

  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [cities, setCities] = useState([]);
  const [city, setCity] = useState(user?.city || '');
  const [day, setDay] = useState('');
  const [reviews, setReviews] = useState([]);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [error, setError] = useState('');

  const loadMovie = () => api.get(`/movies/${id}`).then((res) => setMovie(res.data));
  const loadReviews = () => api.get(`/reviews/movie/${id}`).then((res) => setReviews(res.data));

  useEffect(() => {
    Promise.all([loadMovie(), loadReviews(), api.get('/movies/filters').then((res) => setCities(res.data.cities))]).catch(
      (err) => setError(errorMessage(err))
    );
    if (isCustomer) {
      api.get('/favorites').then((res) => setInWatchlist(res.data.some((m) => m._id === id)));
    }
  }, [id, isCustomer]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    api.get(`/movies/${id}/shows`, { params: city ? { city } : {} }).then((res) => setShows(res.data));
  }, [id, city]);

  const days = useMemo(() => [...new Set(shows.map((s) => new Date(s.startTime).toDateString()))], [shows]);
  const activeDay = days.includes(day) ? day : days[0];

  // Shows for the chosen day, grouped by theatre
  const byTheatre = useMemo(() => {
    const groups = new Map();
    shows
      .filter((s) => new Date(s.startTime).toDateString() === activeDay)
      .forEach((s) => {
        if (!groups.has(s.theatre._id)) groups.set(s.theatre._id, { theatre: s.theatre, shows: [] });
        groups.get(s.theatre._id).shows.push(s);
      });
    return [...groups.values()];
  }, [shows, activeDay]);

  const toggleWatchlist = async () => {
    if (!user) return navigate('/login', { state: { from: `/movies/${id}` } });
    try {
      if (inWatchlist) await api.delete(`/favorites/${id}`);
      else await api.post(`/favorites/${id}`);
      setInWatchlist(!inWatchlist);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (error && !movie) return <div className="alert alert-danger">{error}</div>;
  if (!movie) return <Spinner />;

  return (
    <>
      <div className="row g-4 mb-4">
        <div className="col-md-4 col-lg-3">
          <img
            src={movie.posterUrl || POSTER_FALLBACK}
            onError={(e) => (e.currentTarget.src = POSTER_FALLBACK)}
            className="img-fluid rounded shadow movie-poster w-100"
            alt={movie.title}
          />
        </div>
        <div className="col-md-8 col-lg-9">
          <h2 className="fw-bold">{movie.title}</h2>
          <div className="mb-2">
            {movie.reviewCount > 0 ? (
              <>
                <Stars value={movie.avgRating} /> <strong>{movie.avgRating.toFixed(1)}</strong>/5{' '}
                <a href="#reviews" className="text-muted small">
                  ({movie.reviewCount} review{movie.reviewCount > 1 ? 's' : ''})
                </a>
              </>
            ) : (
              <span className="text-muted small">No reviews yet</span>
            )}
          </div>
          <div className="mb-3">
            <span className="badge bg-secondary me-1">{movie.certificate}</span>
            <span className="badge bg-light text-dark me-1">{movie.language}</span>
            <span className="badge bg-light text-dark me-1">
              {Math.floor(movie.durationMins / 60)}h {movie.durationMins % 60}m
            </span>
            {movie.releaseDate && (
              <span className="badge bg-light text-dark me-1">{new Date(movie.releaseDate).getFullYear()}</span>
            )}
            {movie.genres?.map((g) => (
              <span key={g} className="badge bg-danger-subtle text-danger-emphasis me-1">
                {g}
              </span>
            ))}
          </div>
          <p>{movie.description}</p>
          {movie.director && (
            <p className="mb-1">
              <span className="text-muted">Director:</span> {movie.director}
            </p>
          )}
          {movie.cast?.length > 0 && (
            <p>
              <span className="text-muted">Cast:</span> {movie.cast.join(', ')}
            </p>
          )}
          {user?.role !== 'admin' && (
            <button className={`btn ${inWatchlist ? 'btn-dark' : 'btn-outline-dark'}`} onClick={toggleWatchlist}>
              {inWatchlist ? '✓ In your watchlist' : '+ Add to watchlist'}
            </button>
          )}
        </div>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <h4 className="mb-0">Book tickets</h4>
            <select className="form-select w-auto" value={city} onChange={(e) => setCity(e.target.value)} aria-label="City">
              <option value="">All cities</option>
              {cities.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          {shows.length === 0 ? (
            <p className="text-muted mb-0">No upcoming shows{city && ` in ${city}`}.</p>
          ) : (
            <>
              <div className="d-flex gap-2 mb-3 overflow-auto">
                {days.map((d) => (
                  <button
                    key={d}
                    className={`btn btn-sm ${d === activeDay ? 'btn-danger' : 'btn-outline-secondary'}`}
                    onClick={() => setDay(d)}
                  >
                    {formatDay(d)}
                  </button>
                ))}
              </div>

              <div className="list-group">
                {byTheatre.map(({ theatre, shows: list }) => (
                  <div key={theatre._id} className="list-group-item py-3">
                    <div className="mb-2">
                      <strong>{theatre.name}</strong>
                      <span className="text-muted small"> · {theatre.address || theatre.city}</span>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {list.map((s) => {
                        const soldOut = s.availableSeats === 0;
                        const fillingFast = s.availableSeats / s.totalSeats < 0.3;
                        return (
                          <Link
                            key={s._id}
                            to={`/shows/${s._id}/seats`}
                            title={`Screen ${s.screen} · ${inr(s.price)} · ${s.availableSeats} seats left`}
                            className={`btn btn-sm showtime-btn ${
                              soldOut ? 'btn-secondary disabled' : fillingFast ? 'btn-outline-warning' : 'btn-outline-success'
                            }`}
                          >
                            <div className="fw-semibold">{formatTime(s.startTime)}</div>
                            <div className="small">{soldOut ? 'Sold out' : inr(s.price)}</div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <Reviews movieId={id} reviews={reviews} onChange={() => Promise.all([loadReviews(), loadMovie()])} />
    </>
  );
}

function Reviews({ movieId, reviews, onChange }) {
  const { user } = useAuth();
  const mine = user?.role === 'user' ? reviews.find((r) => r.user?._id === user.id) : null;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setRating(mine?.rating || 0);
    setComment(mine?.comment || '');
  }, [mine?._id, mine?.rating, mine?.comment]);

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) return setError('Please pick a star rating');
    try {
      await api.post('/reviews', { movieId, rating, comment });
      setEditing(false);
      setError('');
      onChange();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete your review?')) return;
    await api.delete(`/reviews/${id}`);
    onChange();
  };

  const showForm = user?.role === 'user' && (!mine || editing);

  return (
    <div className="card shadow-sm" id="reviews">
      <div className="card-body">
        <h4 className="mb-3">Reviews</h4>

        {!user && (
          <p className="text-muted">
            <Link to="/login" state={{ from: `/movies/${movieId}` }}>
              Log in
            </Link>{' '}
            to write a review.
          </p>
        )}

        {showForm && (
          <form onSubmit={submit} className="mb-4 p-3 bg-light rounded">
            <div className="mb-2">
              <span className="me-2">Your rating:</span>
              <Stars value={rating} onChange={setRating} size="1.5rem" />
            </div>
            <textarea
              className="form-control mb-2"
              rows={2}
              placeholder="What did you think of the movie?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
            />
            {error && <div className="text-danger small mb-2">{error}</div>}
            <button className="btn btn-danger btn-sm">{mine ? 'Update review' : 'Post review'}</button>
            {editing && (
              <button type="button" className="btn btn-link btn-sm" onClick={() => setEditing(false)}>
                Cancel
              </button>
            )}
          </form>
        )}

        {reviews.length === 0 && <p className="text-muted mb-0">No reviews yet. Be the first!</p>}
        {reviews.map((r) => (
          <div key={r._id} className="border-bottom py-2">
            <div className="d-flex justify-content-between">
              <div>
                <strong>{r.user?.name || 'Deleted user'}</strong> <Stars value={r.rating} size="0.9rem" />
              </div>
              <small className="text-muted">{new Date(r.updatedAt).toLocaleDateString()}</small>
            </div>
            {r.comment && <p className="mb-1">{r.comment}</p>}
            {mine?._id === r._id && !editing && (
              <div className="small">
                <button className="btn btn-link btn-sm p-0 me-3" onClick={() => setEditing(true)}>
                  Edit
                </button>
                <button className="btn btn-link btn-sm p-0 text-danger" onClick={() => remove(r._id)}>
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
