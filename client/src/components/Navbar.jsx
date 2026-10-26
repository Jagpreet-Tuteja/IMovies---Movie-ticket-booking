import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    logout();
    navigate(isAdmin ? '/admin/login' : '/');
  };

  const link = (to, label, end) => (
    <li className="nav-item">
      <NavLink className="nav-link" to={to} end={end}>
        {label}
      </NavLink>
    </li>
  );

  return (
    <nav className="navbar navbar-expand-md navbar-dark bg-dark sticky-top">
      <div className="container">
        <Link className="navbar-brand fw-bold" to={isAdmin ? '/admin' : '/'}>
          🎬 IMovies{isAdmin && <span className="badge bg-danger ms-2 fs-6 fw-normal">Admin</span>}
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav">
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav me-auto">
            {isAdmin ? (
              link('/admin', 'Dashboard', true)
            ) : (
              <>
                {link('/', 'Movies', true)}
                {user && link('/watchlist', 'Watchlist')}
                {user && link('/bookings', 'My Bookings')}
              </>
            )}
          </ul>
          <div className="d-flex align-items-center gap-2">
            {user ? (
              <>
                {isAdmin ? (
                  <span className="navbar-text text-light small">{user.name}</span>
                ) : (
                  <Link to="/profile" className="navbar-text text-light small text-decoration-none">
                    👤 {user.name}
                  </Link>
                )}
                <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link className="btn btn-outline-light btn-sm" to="/login">
                  Login
                </Link>
                <Link className="btn btn-danger btn-sm" to="/register">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
