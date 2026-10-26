import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorMessage, safeRedirect } from '../api/client';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return setError('Passwords do not match');
    setBusy(true);
    setError('');
    try {
      const { confirm, ...fields } = form; // eslint-disable-line no-unused-vars
      await register(fields);
      navigate(safeRedirect(location.state?.from), { replace: true });
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
            <h3 className="mb-3">Create account</h3>
            {error && <div className="alert alert-danger py-2">{error}</div>}
            <form onSubmit={submit}>
              <div className="mb-3">
                <label className="form-label" htmlFor="name">
                  Full name
                </label>
                <input id="name" className="form-control" required value={form.name} onChange={update('name')} />
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="email">
                  Email
                </label>
                <input id="email" type="email" className="form-control" required value={form.email} onChange={update('email')} />
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="phone">
                  Phone <span className="text-muted small">(optional)</span>
                </label>
                <input id="phone" type="tel" className="form-control" value={form.phone} onChange={update('phone')} />
              </div>
              <div className="row g-2 mb-3">
                <div className="col">
                  <label className="form-label" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    className="form-control"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={update('password')}
                  />
                </div>
                <div className="col">
                  <label className="form-label" htmlFor="confirm">
                    Confirm
                  </label>
                  <input
                    id="confirm"
                    type="password"
                    className="form-control"
                    required
                    autoComplete="new-password"
                    value={form.confirm}
                    onChange={update('confirm')}
                  />
                </div>
              </div>
              <button className="btn btn-danger w-100" disabled={busy}>
                {busy ? 'Creating account...' : 'Sign up'}
              </button>
            </form>
            <p className="mt-3 mb-0 small text-center">
              Already have an account?{' '}
              <Link to="/login" state={location.state}>
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
