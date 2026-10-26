import { useEffect, useState } from 'react';
import api, { errorMessage, POSTER_FALLBACK } from '../../api/client';

const EMPTY = {
  title: '',
  description: '',
  genres: '',
  language: 'English',
  durationMins: 120,
  certificate: 'UA',
  cast: '',
  director: '',
  posterUrl: '',
  releaseDate: '',
};

const splitList = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);

export default function AdminMovies() {
  const [movies, setMovies] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState(null);

  const load = () => api.get('/movies').then((res) => setMovies(res.data));
  useEffect(() => {
    load();
  }, []);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const edit = (m) => {
    setEditingId(m._id);
    setForm({
      ...EMPTY,
      ...m,
      genres: m.genres.join(', '),
      cast: m.cast.join(', '),
      releaseDate: m.releaseDate ? m.releaseDate.slice(0, 10) : '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const reset = () => {
    setEditingId(null);
    setForm(EMPTY);
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      title: form.title,
      description: form.description,
      genres: splitList(form.genres),
      language: form.language,
      durationMins: Number(form.durationMins),
      certificate: form.certificate,
      cast: splitList(form.cast),
      director: form.director,
      posterUrl: form.posterUrl,
      releaseDate: form.releaseDate || undefined,
    };
    try {
      if (editingId) await api.put(`/movies/${editingId}`, payload);
      else await api.post('/movies', payload);
      setMessage({ type: 'success', text: editingId ? 'Movie updated' : 'Movie added' });
      reset();
      load();
    } catch (err) {
      setMessage({ type: 'danger', text: errorMessage(err) });
    }
  };

  const remove = async (m) => {
    if (!window.confirm(`Delete "${m.title}" and all its shows?`)) return;
    try {
      await api.delete(`/movies/${m._id}`);
      setMessage({ type: 'success', text: 'Movie deleted' });
      load();
    } catch (err) {
      setMessage({ type: 'danger', text: errorMessage(err) });
    }
  };

  return (
    <>
      <h3 className="mb-3">Movies</h3>
      {message && (
        <div className={`alert alert-${message.type} alert-dismissible`}>
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage(null)} />
        </div>
      )}

      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white fw-semibold">{editingId ? 'Edit movie' : 'Add a movie'}</div>
        <form className="card-body row g-2" onSubmit={submit}>
          <div className="col-md-8">
            <label className="form-label small mb-0">Title</label>
            <input className="form-control" required value={form.title} onChange={set('title')} />
          </div>
          <div className="col-md-4">
            <label className="form-label small mb-0">Language</label>
            <input className="form-control" required value={form.language} onChange={set('language')} />
          </div>
          <div className="col-12">
            <label className="form-label small mb-0">Description</label>
            <textarea className="form-control" rows={2} value={form.description} onChange={set('description')} />
          </div>
          <div className="col-md-6">
            <label className="form-label small mb-0">Genres (comma separated)</label>
            <input className="form-control" placeholder="Action, Drama" value={form.genres} onChange={set('genres')} />
          </div>
          <div className="col-md-6">
            <label className="form-label small mb-0">Director</label>
            <input className="form-control" value={form.director} onChange={set('director')} />
          </div>
          <div className="col-12">
            <label className="form-label small mb-0">Cast (comma separated)</label>
            <input className="form-control" value={form.cast} onChange={set('cast')} />
          </div>
          <div className="col-md-4">
            <label className="form-label small mb-0">Duration (minutes)</label>
            <input type="number" min={1} className="form-control" required value={form.durationMins} onChange={set('durationMins')} />
          </div>
          <div className="col-md-4">
            <label className="form-label small mb-0">Certificate</label>
            <select className="form-select" value={form.certificate} onChange={set('certificate')}>
              {['U', 'UA', 'A', 'S'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label small mb-0">Release date</label>
            <input type="date" className="form-control" value={form.releaseDate} onChange={set('releaseDate')} />
          </div>
          <div className="col-12">
            <label className="form-label small mb-0">Poster image URL</label>
            <input type="url" className="form-control" value={form.posterUrl} onChange={set('posterUrl')} />
          </div>
          <div className="col-12 d-flex gap-2 mt-3">
            <button className="btn btn-danger">{editingId ? 'Save changes' : 'Add movie'}</button>
            {editingId && (
              <button type="button" className="btn btn-outline-secondary" onClick={reset}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th />
                <th>Title</th>
                <th>Language</th>
                <th>Duration</th>
                <th>Rating</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {movies.map((m) => (
                <tr key={m._id}>
                  <td style={{ width: 50 }}>
                    <img
                      src={m.posterUrl || POSTER_FALLBACK}
                      onError={(e) => (e.currentTarget.src = POSTER_FALLBACK)}
                      alt=""
                      className="rounded movie-poster"
                      style={{ width: 36 }}
                    />
                  </td>
                  <td>
                    <div className="fw-semibold">{m.title}</div>
                    <small className="text-muted">{m.genres.join(', ')}</small>
                  </td>
                  <td>{m.language}</td>
                  <td>{m.durationMins} min</td>
                  <td>{m.reviewCount ? `★ ${m.avgRating} (${m.reviewCount})` : '-'}</td>
                  <td className="text-end text-nowrap">
                    <button className="btn btn-sm btn-outline-dark me-1" onClick={() => edit(m)}>
                      Edit
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => remove(m)}>
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
