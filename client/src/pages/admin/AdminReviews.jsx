import { useEffect, useState } from 'react';
import api, { errorMessage } from '../../api/client';
import Stars from '../../components/Stars';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/reviews').then((res) => setReviews(res.data));
  }, []);

  const remove = async (r) => {
    if (!window.confirm(`Remove ${r.user?.name}'s review of ${r.movie?.title}?`)) return;
    try {
      await api.delete(`/reviews/${r._id}`);
      setReviews((prev) => prev.filter((x) => x._id !== r._id));
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <>
      <h3 className="mb-3">Reviews</h3>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Movie</th>
                <th>Customer</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {reviews.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    No reviews yet
                  </td>
                </tr>
              )}
              {reviews.map((r) => (
                <tr key={r._id}>
                  <td className="fw-semibold">{r.movie?.title || 'Deleted movie'}</td>
                  <td>
                    {r.user?.name}
                    <div className="small text-muted">{r.user?.email}</div>
                  </td>
                  <td className="text-nowrap">
                    <Stars value={r.rating} size="0.9rem" />
                  </td>
                  <td className="small">{r.comment || <span className="text-muted">-</span>}</td>
                  <td className="small">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-danger" onClick={() => remove(r)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
