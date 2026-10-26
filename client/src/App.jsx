import { Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import MovieDetails from './pages/MovieDetails';
import SeatSelection from './pages/SeatSelection';
import Checkout from './pages/Checkout';
import MyBookings from './pages/MyBookings';
import Ticket from './pages/Ticket';
import Watchlist from './pages/Watchlist';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import AdminMovies from './pages/admin/AdminMovies';
import AdminTheatres from './pages/admin/AdminTheatres';
import AdminShows from './pages/admin/AdminShows';
import AdminBookings from './pages/admin/AdminBookings';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReviews from './pages/admin/AdminReviews';

const customer = (page) => <ProtectedRoute role="user">{page}</ProtectedRoute>;

export default function App() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <main className="container py-4 flex-grow-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies/:id" element={<MovieDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<Login admin />} />
          <Route path="/register" element={<Register />} />

          <Route path="/shows/:id/seats" element={customer(<SeatSelection />)} />
          <Route path="/checkout/:id" element={customer(<Checkout />)} />
          <Route path="/bookings" element={customer(<MyBookings />)} />
          <Route path="/bookings/:id" element={customer(<Ticket />)} />
          <Route path="/watchlist" element={customer(<Watchlist />)} />
          <Route path="/profile" element={customer(<Profile />)} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="movies" element={<AdminMovies />} />
            <Route path="theatres" element={<AdminTheatres />} />
            <Route path="shows" element={<AdminShows />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="reviews" element={<AdminReviews />} />
          </Route>

          <Route
            path="*"
            element={
              <div className="text-center py-5">
                <h2>Page not found</h2>
                <Link to="/">Back to movies</Link>
              </div>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
