import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorMessage, safeRedirect } from '../api/client';

// Customer login, or admin login when `admin` is set
export default function Login({ admin = false }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = await login(form.email, form.password, admin);
      navigate(user.role === 'admin' ? '/admin' : safeRedirect(location.state?.from), { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-5">
        <div className="card shadow-sm">
          <div className="card-body p-4">
            <h3 className="mb-1">{admin ? 'Admin login' : 'Welcome back'}</h3>
            <p className="text-muted small mb-3">
              {admin ? 'Manage movies, theatres, shows and bookings.' : 'Log in to book tickets.'}
            </p>
            {error && <div className="alert alert-danger py-2">{error}</div>}
            <form onSubmit={submit}>
              <div className="mb-3">
                <label className="form-label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="form-control"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="form-control"
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <button className={`btn w-100 ${admin ? 'btn-dark' : 'btn-danger'}`} disabled={busy}>
                {busy ? 'Signing in...' : 'Login'}
              </button>
            </form>
            <p className="mt-3 mb-0 small text-center">
              {admin ? (
                <Link to="/login">Customer login</Link>
              ) : (
                <>
                  New here?{' '}
                  <Link to="/register" state={location.state}>
                    Create an account
                  </Link>
                  {' · '}
                  <Link to="/admin/login">Admin login</Link>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
