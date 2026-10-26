import { NavLink, Outlet } from 'react-router-dom';

const LINKS = [
  ['', '📊 Dashboard'],
  ['movies', '🎞️ Movies'],
  ['theatres', '🏢 Theatres'],
  ['shows', '🕒 Shows'],
  ['bookings', '🎟️ Bookings'],
  ['users', '👥 Users'],
  ['reviews', '⭐ Reviews'],
];

export default function AdminLayout() {
  return (
    <div className="row g-4">
      <div className="col-md-3 col-lg-2">
        <nav className="nav flex-md-column admin-nav gap-1 bg-white p-2 rounded shadow-sm">
          {LINKS.map(([to, label]) => (
            <NavLink key={to} to={to ? `/admin/${to}` : '/admin'} end className="nav-link py-2">
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="col-md-9 col-lg-10">
        <Outlet />
      </div>
    </div>
  );
}
