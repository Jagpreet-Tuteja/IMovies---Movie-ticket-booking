import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-dark text-white-50 py-4 mt-5 small">
      <div className="container d-flex flex-wrap justify-content-between gap-2">
        <span>🎬 IMovies · Movie ticket booking made simple</span>
        <span>
          <Link to="/admin/login" className="text-white-50">
            Admin login
          </Link>
        </span>
      </div>
    </footer>
  );
}
