import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage, formatDateTime, inr } from '../../api/client';
import Spinner from '../../components/Spinner';

function RevenueTable({ title, rows }) {
  const max = Math.max(1, ...rows.map((r) => r.revenue));
  return (
    <div className="card shadow-sm h-100">
      <div className="card-header bg-white fw-semibold">{title}</div>
      <div className="card-body">
        {rows.length === 0 && <p className="text-muted mb-0">No bookings yet.</p>}
        {rows.map((r) => (
          <div key={r.name} className="mb-3">
            <div className="d-flex justify-content-between small">
              <span>{r.name}</span>
              <span>
                <strong>{inr(r.revenue)}</strong> · {r.tickets} tickets
              </span>
            </div>
            <div className="progress" style={{ height: 6 }}>
              <div className="progress-bar bg-danger" style={{ width: `${(r.revenue / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/admin/stats')
      .then((res) => setStats(res.data))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!stats) return <Spinner />;

  const cards = [
    ['Total revenue', inr(stats.revenue), 'bookings'],
    ['Confirmed bookings', stats.counts.bookings, 'bookings'],
    ['Customers', stats.counts.users, 'users'],
    ['Movies', stats.counts.movies, 'movies'],
    ['Theatres', stats.counts.theatres, 'theatres'],
    ['Upcoming shows', stats.counts.upcomingShows, 'shows'],
  ];

  return (
    <>
      <h3 className="mb-3">Dashboard</h3>
      <div className="row row-cols-2 row-cols-lg-3 g-3 mb-4">
        {cards.map(([label, value, to]) => (
          <div className="col" key={label}>
            <Link to={`/admin/${to}`} className="text-decoration-none">
              <div className="card shadow-sm stat-card h-100">
                <div className="card-body">
                  <div className="text-muted small">{label}</div>
                  <div className="display-6 text-dark">{value}</div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      <div className="row g-3 mb-4">
        <div className="col-lg-6">
          <RevenueTable title="Revenue by movie" rows={stats.byMovie} />
        </div>
        <div className="col-lg-6">
          <RevenueTable title="Revenue by theatre" rows={stats.byTheatre} />
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-header bg-white fw-semibold">Recent bookings</div>
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>Customer</th>
                <th>Movie</th>
                <th>Show</th>
                <th>Seats</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-muted text-center">
                    No bookings yet
                  </td>
                </tr>
              )}
              {stats.recent.map((b) => (
                <tr key={b._id}>
                  <td>{b.user?.name}</td>
                  <td>{b.show?.movie?.title || '-'}</td>
                  <td className="small">{b.show ? formatDateTime(b.show.startTime) : '-'}</td>
                  <td>{b.seats.join(', ')}</td>
                  <td>{inr(b.totalPrice)}</td>
                  <td>
                    <span className={`badge ${b.status === 'confirmed' ? 'bg-success' : 'bg-secondary'}`}>{b.status}</span>
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
