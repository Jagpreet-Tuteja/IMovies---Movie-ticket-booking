import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import MovieCard from '../components/MovieCard';
import Spinner from '../components/Spinner';

export default function Home() {
  const { user } = useAuth();
  const [movies, setMovies] = useState(null);
  const [options, setOptions] = useState({ genres: [], languages: [], cities: [] });
  const [filters, setFilters] = useState({ search: '', genre: '', language: '', minRating: '', city: user?.city || '' });
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/movies/filters').then((res) => setOptions(res.data));
  }, []);

  // Refetch when filters change; wait for typing to pause before searching
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      api
        .get('/movies', { params })
        .then((res) => {
          setMovies(res.data);
          setError('');
        })
        .catch((err) => setError(errorMessage(err)));
    }, 250);
    return () => clearTimeout(timer);
  }, [filters]);

  const set = (field) => (e) => setFilters({ ...filters, [field]: e.target.value });
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <>
      <div className="hero p-4 p-md-5 mb-4 text-white rounded-3">
        <h1 className="fw-bold">Now Showing</h1>
        <p className="mb-0 text-white-50">Pick a movie, choose a showtime and grab your seats in seconds.</p>
      </div>

      <div className="row g-2 mb-4">
        <div className="col-md-4">
          <input className="form-control" placeholder="🔍 Search movies..." value={filters.search} onChange={set('search')} />
        </div>
        <div className="col-6 col-md-2">
          <select className="form-select" value={filters.city} onChange={set('city')} aria-label="City">
            <option value="">All cities</option>
            {options.cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="col-6 col-md-2">
          <select className="form-select" value={filters.genre} onChange={set('genre')} aria-label="Genre">
            <option value="">All genres</option>
            {options.genres.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </div>
        <div className="col-6 col-md-2">
          <select className="form-select" value={filters.language} onChange={set('language')} aria-label="Language">
            <option value="">All languages</option>
            {options.languages.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </div>
        <div className="col-6 col-md-2">
          <select className="form-select" value={filters.minRating} onChange={set('minRating')} aria-label="Rating">
            <option value="">Any rating</option>
            <option value="4">★ 4 & up</option>
            <option value="3">★ 3 & up</option>
          </select>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {!movies && !error && <Spinner />}
      {movies?.length === 0 && (
        <p className="text-muted">
          No movies match your filters.{' '}
          {hasFilters && (
            <button
              className="btn btn-link p-0 align-baseline"
              onClick={() => setFilters({ search: '', genre: '', language: '', minRating: '', city: '' })}
            >
              Clear filters
            </button>
          )}
        </p>
      )}

      <div className="row row-cols-2 row-cols-md-3 row-cols-lg-5 g-4">
        {movies?.map((m) => (
          <div className="col" key={m._id}>
            <MovieCard movie={m} />
          </div>
        ))}
      </div>
    </>
  );
}
