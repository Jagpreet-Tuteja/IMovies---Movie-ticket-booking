import { Link } from 'react-router-dom';
import { POSTER_FALLBACK } from '../api/client';

export default function MovieCard({ movie, action }) {
  return (
    <div className="card h-100 movie-card border-0 shadow-sm">
      <Link to={`/movies/${movie._id}`} className="text-decoration-none text-reset">
        <div className="position-relative">
          <img
            src={movie.posterUrl || POSTER_FALLBACK}
            onError={(e) => (e.currentTarget.src = POSTER_FALLBACK)}
            className="card-img-top movie-poster"
            alt={movie.title}
          />
          {movie.reviewCount > 0 && (
            <span className="badge bg-dark bg-opacity-75 position-absolute bottom-0 start-0 m-2">
              <span className="text-warning">★</span> {movie.avgRating.toFixed(1)} · {movie.reviewCount}
            </span>
          )}
          <span className="badge bg-light text-dark position-absolute top-0 end-0 m-2">{movie.certificate}</span>
        </div>
        <div className="card-body pb-2">
          <h6 className="card-title mb-1">{movie.title}</h6>
          <small className="text-muted">
            {movie.genres?.join(', ')} · {movie.language}
          </small>
        </div>
      </Link>
      {action && <div className="card-footer bg-transparent border-0 pt-0">{action}</div>}
    </div>
  );
}
