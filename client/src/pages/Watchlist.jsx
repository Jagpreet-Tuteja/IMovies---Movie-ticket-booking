import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import MovieCard from '../components/MovieCard';
import Spinner from '../components/Spinner';

export default function Watchlist() {
  const [movies, setMovies] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/favorites')
      .then((res) => setMovies(res.data))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  const remove = async (id) => {
    await api.delete(`/favorites/${id}`);
    setMovies((prev) => prev.filter((m) => m._id !== id));
  };

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!movies) return <Spinner />;

  return (
    <>
      <h2 className="mb-3">My Watchlist</h2>
      {movies.length === 0 && (
        <p className="text-muted">
          Your watchlist is empty. Open a movie and click <strong>+ Add to watchlist</strong>. <Link to="/">Browse movies</Link>
        </p>
      )}
      <div className="row row-cols-2 row-cols-md-3 row-cols-lg-5 g-4">
        {movies.map((m) => (
          <div className="col" key={m._id}>
            <MovieCard
              movie={m}
              action={
                <button className="btn btn-sm btn-outline-danger w-100" onClick={() => remove(m._id)}>
                  Remove
                </button>
              }
            />
          </div>
        ))}
      </div>
    </>
  );
}
