import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../api/client';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: user.name, phone: user.phone, city: user.city });
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await updateProfile(form);
      setMessage({ type: 'success', text: 'Profile updated' });
    } catch (err) {
      setMessage({ type: 'danger', text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <div className="card shadow-sm">
          <div className="card-body p-4">
            <h3 className="mb-3">My Profile</h3>
            {message && <div className={`alert alert-${message.type} py-2`}>{message.text}</div>}
            <form onSubmit={submit}>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input className="form-control" value={user.email} disabled />
              </div>
              <div className="mb-3">
                <label className="form-label">Name</label>
                <input className="form-control" required value={form.name} onChange={set('name')} />
              </div>
              <div className="mb-3">
                <label className="form-label">Phone</label>
                <input className="form-control" type="tel" value={form.phone} onChange={set('phone')} />
              </div>
              <div className="mb-3">
                <label className="form-label">Preferred city</label>
                <input className="form-control" value={form.city} onChange={set('city')} placeholder="e.g. Mumbai" />
                <div className="form-text">Used to show nearby theatres first.</div>
              </div>
              <button className="btn btn-danger" disabled={busy}>
                {busy ? 'Saving...' : 'Save changes'}
              </button>
            </form>
            <hr />
            <div className="d-flex gap-3">
              <Link to="/bookings">My bookings</Link>
              <Link to="/watchlist">My watchlist</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
