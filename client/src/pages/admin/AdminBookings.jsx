import { useEffect, useState } from 'react';
import api, { errorMessage, formatDateTime, inr } from '../../api/client';

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState(null);

  useEffect(() => {
    api.get('/admin/bookings', { params: status ? { status } : {} }).then((res) => setBookings(res.data));
  }, [status]);

  const cancel = async (b) => {
    if (!window.confirm(`Cancel booking for ${b.user?.name}? The customer will be refunded.`)) return;
    try {
      const { data } = await api.patch(`/admin/bookings/${b._id}/cancel`);
      setBookings((prev) => prev.map((x) => (x._id === b._id ? { ...x, status: data.status, payment: { ...x.payment, status: 'refunded' } } : x)));
      setMessage({ type: 'success', text: 'Booking cancelled and refunded' });
    } catch (err) {
      setMessage({ type: 'danger', text: errorMessage(err) });
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Bookings</h3>
        <select className="form-select w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All bookings</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      {message && (
        <div className={`alert alert-${message.type} alert-dismissible`}>
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage(null)} />
        </div>
      )}

      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 small">
            <thead className="table-light">
              <tr>
                <th>Booked on</th>
                <th>Customer</th>
                <th>Movie / show</th>
                <th>Seats</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-4">
                    No bookings found
                  </td>
                </tr>
              )}
              {bookings.map((b) => {
                const upcoming = b.show && new Date(b.show.startTime) > new Date();
                return (
                  <tr key={b._id}>
                    <td>{formatDateTime(b.createdAt)}</td>
                    <td>
                      {b.user?.name}
                      <div className="text-muted">{b.user?.email}</div>
                    </td>
                    <td>
                      <span className="fw-semibold">{b.show?.movie?.title || 'Show removed'}</span>
                      {b.show && (
                        <div className="text-muted">
                          {b.show.theatre?.name} · {formatDateTime(b.show.startTime)}
                        </div>
                      )}
                    </td>
                    <td>{b.seats.join(', ')}</td>
                    <td>{inr(b.totalPrice)}</td>
                    <td>
                      {b.payment?.method?.toUpperCase()}
                      <div className="text-muted">{b.payment?.status}</div>
                    </td>
                    <td>
                      <span className={`badge ${b.status === 'confirmed' ? 'bg-success' : 'bg-secondary'}`}>{b.status}</span>
                    </td>
                    <td className="text-end">
                      {b.status === 'confirmed' && upcoming && (
                        <button className="btn btn-sm btn-outline-danger" onClick={() => cancel(b)}>
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
