import { useEffect, useState } from 'react';
import api, { errorMessage, formatDateTime, inr } from '../../api/client';

const EMPTY = { movie: '', theatre: '', screen: 1, startTime: '', price: 200, rows: 8, seatsPerRow: 12 };

export default function AdminShows() {
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [filter, setFilter] = useState({ movie: '', theatre: '' });
  const [message, setMessage] = useState(null);

  const load = () => api.get('/shows').then((res) => setShows(res.data));
  useEffect(() => {
    load();
    api.get('/movies').then((res) => setMovies(res.data));
    api.get('/theatres').then((res) => setTheatres(res.data));
  }, []);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const selectedTheatre = theatres.find((t) => t._id === form.theatre);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/shows', {
        ...form,
        startTime: new Date(form.startTime).toISOString(),
        screen: Number(form.screen),
        price: Number(form.price),
        rows: Number(form.rows),
        seatsPerRow: Number(form.seatsPerRow),
      });
      setMessage({ type: 'success', text: 'Show scheduled' });
      setForm({ ...EMPTY, movie: form.movie, theatre: form.theatre });
      load();
    } catch (err) {
      setMessage({ type: 'danger', text: errorMessage(err) });
    }
  };

  const remove = async (s) => {
    if (!window.confirm('Delete this show?')) return;
    try {
      await api.delete(`/shows/${s._id}`);
      setMessage({ type: 'success', text: 'Show deleted' });
      load();
    } catch (err) {
      setMessage({ type: 'danger', text: errorMessage(err) });
    }
  };

  const visible = shows.filter(
    (s) => (!filter.movie || s.movie?._id === filter.movie) && (!filter.theatre || s.theatre?._id === filter.theatre)
  );

  return (
    <>
      <h3 className="mb-3">Shows</h3>
      {message && (
        <div className={`alert alert-${message.type} alert-dismissible`}>
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage(null)} />
        </div>
      )}

      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white fw-semibold">Schedule a show</div>
        <form className="card-body row g-2" onSubmit={submit}>
          <div className="col-md-6">
            <label className="form-label small mb-0">Movie</label>
            <select className="form-select" required value={form.movie} onChange={set('movie')}>
              <option value="">Select movie...</option>
              {movies.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.title} ({m.durationMins} min)
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label small mb-0">Theatre</label>
            <select className="form-select" required value={form.theatre} onChange={(e) => setForm({ ...form, theatre: e.target.value, screen: 1 })}>
              <option value="">Select theatre...</option>
              {theatres.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}, {t.city}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label small mb-0">Screen</label>
            <select className="form-select" value={form.screen} onChange={set('screen')} disabled={!selectedTheatre}>
              {Array.from({ length: selectedTheatre?.screens || 1 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label small mb-0">Start time</label>
            <input type="datetime-local" className="form-control" required value={form.startTime} onChange={set('startTime')} />
          </div>
          <div className="col-md-3">
            <label className="form-label small mb-0">Ticket price (₹)</label>
            <input type="number" min={0} className="form-control" required value={form.price} onChange={set('price')} />
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label small mb-0">Rows</label>
            <input type="number" min={1} max={26} className="form-control" value={form.rows} onChange={set('rows')} />
          </div>
          <div className="col-6 col-md-3">
            <label className="form-label small mb-0">Seats per row</label>
            <input type="number" min={1} max={30} className="form-control" value={form.seatsPerRow} onChange={set('seatsPerRow')} />
          </div>
          <div className="col-12 mt-3">
            <button className="btn btn-danger">Schedule show</button>
            <span className="small text-muted ms-2">The screen must be free for the movie's length plus 15 minutes.</span>
          </div>
        </form>
      </div>

      <div className="card shadow-sm">
        <div className="card-header bg-white d-flex flex-wrap gap-2 align-items-center">
          <strong className="me-auto">Upcoming shows ({visible.length})</strong>
          <select className="form-select form-select-sm w-auto" value={filter.movie} onChange={(e) => setFilter({ ...filter, movie: e.target.value })}>
            <option value="">All movies</option>
            {movies.map((m) => (
              <option key={m._id} value={m._id}>
                {m.title}
              </option>
            ))}
          </select>
          <select className="form-select form-select-sm w-auto" value={filter.theatre} onChange={(e) => setFilter({ ...filter, theatre: e.target.value })}>
            <option value="">All theatres</option>
            {theatres.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="table-responsive" style={{ maxHeight: 520 }}>
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light sticky-top">
              <tr>
                <th>Movie</th>
                <th>Theatre</th>
                <th>Screen</th>
                <th>Start time</th>
                <th>Price</th>
                <th>Taken</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => (
                <tr key={s._id}>
                  <td className="fw-semibold">{s.movie?.title}</td>
                  <td>
                    {s.theatre?.name}
                    <div className="small text-muted">{s.theatre?.city}</div>
                  </td>
                  <td>{s.screen}</td>
                  <td className="small">{formatDateTime(s.startTime)}</td>
                  <td>{inr(s.price)}</td>
                  <td>
                    {s.takenSeats}/{s.rows * s.seatsPerRow}
                  </td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-danger" onClick={() => remove(s)}>
                      Delete
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
