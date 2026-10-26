import { useEffect, useState } from 'react';
import api, { errorMessage } from '../../api/client';

const EMPTY = { name: '', city: '', address: '', screens: 1 };

export default function AdminTheatres() {
  const [theatres, setTheatres] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState(null);

  const load = () => api.get('/theatres').then((res) => setTheatres(res.data));
  useEffect(() => {
    load();
  }, []);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const reset = () => {
    setEditingId(null);
    setForm(EMPTY);
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = { ...form, screens: Number(form.screens) };
    try {
      if (editingId) await api.put(`/theatres/${editingId}`, payload);
      else await api.post('/theatres', payload);
      setMessage({ type: 'success', text: editingId ? 'Theatre updated' : 'Theatre added' });
      reset();
      load();
    } catch (err) {
      setMessage({ type: 'danger', text: errorMessage(err) });
    }
  };

  const remove = async (t) => {
    if (!window.confirm(`Delete ${t.name}?`)) return;
    try {
      await api.delete(`/theatres/${t._id}`);
      setMessage({ type: 'success', text: 'Theatre deleted' });
      load();
    } catch (err) {
      setMessage({ type: 'danger', text: errorMessage(err) });
    }
  };

  return (
    <>
      <h3 className="mb-3">Theatres</h3>
      {message && (
        <div className={`alert alert-${message.type} alert-dismissible`}>
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage(null)} />
        </div>
      )}

      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white fw-semibold">{editingId ? 'Edit theatre' : 'Add a theatre'}</div>
        <form className="card-body row g-2" onSubmit={submit}>
          <div className="col-md-5">
            <label className="form-label small mb-0">Theatre name</label>
            <input className="form-control" required value={form.name} onChange={set('name')} />
          </div>
          <div className="col-md-4">
            <label className="form-label small mb-0">City</label>
            <input className="form-control" required value={form.city} onChange={set('city')} />
          </div>
          <div className="col-md-3">
            <label className="form-label small mb-0">Screens</label>
            <input type="number" min={1} max={20} className="form-control" required value={form.screens} onChange={set('screens')} />
          </div>
          <div className="col-12">
            <label className="form-label small mb-0">Address</label>
            <input className="form-control" value={form.address} onChange={set('address')} />
          </div>
          <div className="col-12 d-flex gap-2 mt-3">
            <button className="btn btn-danger">{editingId ? 'Save changes' : 'Add theatre'}</button>
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
                <th>Name</th>
                <th>City</th>
                <th>Address</th>
                <th>Screens</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {theatres.map((t) => (
                <tr key={t._id}>
                  <td className="fw-semibold">{t.name}</td>
                  <td>{t.city}</td>
                  <td className="small text-muted">{t.address}</td>
                  <td>{t.screens}</td>
                  <td className="text-end text-nowrap">
                    <button
                      className="btn btn-sm btn-outline-dark me-1"
                      onClick={() => {
                        setEditingId(t._id);
                        setForm({ name: t.name, city: t.city, address: t.address, screens: t.screens });
                      }}
                    >
                      Edit
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => remove(t)}>
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
