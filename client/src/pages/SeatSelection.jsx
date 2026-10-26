import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { errorMessage, formatDateTime, inr } from '../api/client';
import { socket } from '../api/socket';
import Spinner from '../components/Spinner';

const MAX_SEATS = 10;
// Hosts without WebSocket support (like Vercel) build with VITE_REALTIME=polling and refresh often instead.
// With Socket.io we still refresh now and then, because seat holds expire without a socket event.
const REALTIME = import.meta.env.VITE_REALTIME !== 'polling';
const REFRESH_MS = REALTIME ? 30000 : 4000;

export default function SeatSelection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [show, setShow] = useState(null);
  const [map, setMap] = useState({ booked: [], locked: [], mine: [] });
  const [selected, setSelected] = useState([]);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const { data } = await api.get(`/shows/${id}/seats`);
    setMap(data);
    setSelected((prev) => {
      const unavailable = new Set([...data.booked, ...data.locked]);
      const lost = prev.filter((s) => unavailable.has(s));
      if (lost.length) setNotice(`${lost.join(', ')} ${lost.length === 1 ? 'was' : 'were'} just taken by someone else.`);
      return prev.filter((s) => !unavailable.has(s));
    });
    return data;
  }, [id]);

  useEffect(() => {
    api
      .get(`/shows/${id}`)
      .then((res) => setShow(res.data))
      .catch((err) => setError(errorMessage(err)));
    // If the user came back from checkout, start with the seats they're still holding
    refresh().then((data) => data.mine.length && setSelected(data.mine));

    const onSeatsChanged = () => refresh().catch(() => {});
    const timer = setInterval(onSeatsChanged, REFRESH_MS);
    if (!REALTIME) return () => clearInterval(timer);

    // Live updates: the server tells everyone viewing this show when any seat changes
    const join = () => socket.emit('show:join', id);
    socket.connect();
    join();
    socket.on('connect', join);
    socket.on('seats:changed', onSeatsChanged);

    return () => {
      socket.emit('show:leave', id);
      socket.off('connect', join);
      socket.off('seats:changed', onSeatsChanged);
      clearInterval(timer);
    };
  }, [id, refresh]);

  const toggleSeat = (seat) => {
    setNotice('');
    setSelected((prev) => {
      if (prev.includes(seat)) return prev.filter((s) => s !== seat);
      if (prev.length >= MAX_SEATS) {
        setNotice(`You can select up to ${MAX_SEATS} seats.`);
        return prev;
      }
      return [...prev, seat];
    });
  };

  const proceed = async () => {
    setBusy(true);
    setError('');
    try {
      await api.post(`/shows/${id}/lock`, { seats: selected });
      navigate(`/checkout/${id}`);
    } catch (err) {
      setError(errorMessage(err));
      await refresh();
      setBusy(false);
    }
  };

  if (error && !show) return <div className="alert alert-danger">{error}</div>;
  if (!show) return <Spinner />;

  const booked = new Set(map.booked);
  const held = new Set(map.locked);
  const aisleAfter = Math.floor(show.seatsPerRow / 2);
  const rows = Array.from({ length: show.rows }, (_, r) => String.fromCharCode(65 + r));
  const seatsLeft = show.rows * show.seatsPerRow - booked.size - held.size;
  const sortedSelection = [...selected].sort((a, b) =>
    a[0] === b[0] ? Number(a.slice(1)) - Number(b.slice(1)) : a.localeCompare(b)
  );

  return (
    <>
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
        <div>
          <h3 className="mb-1">{show.movie?.title}</h3>
          <div className="text-muted">
            {show.theatre?.name}, {show.theatre?.city} · Screen {show.screen} · {formatDateTime(show.startTime)}
          </div>
        </div>
        <span className="badge bg-success-subtle text-success-emphasis">● Live · {seatsLeft} seats left</span>
      </div>

      {notice && <div className="alert alert-warning py-2">{notice}</div>}
      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="card shadow-sm">
        <div className="card-body">
          <div className="screen-bar" />
          <p className="text-center text-muted small mb-4">SCREEN THIS WAY</p>

          <div className="seat-grid">
            {rows.map((row) => (
              <div className="seat-row" key={row}>
                <span className="seat-row-label">{row}</span>
                {Array.from({ length: show.seatsPerRow }, (_, i) => {
                  const seat = `${row}${i + 1}`;
                  const state = booked.has(seat) ? 'booked' : held.has(seat) ? 'held' : selected.includes(seat) ? 'selected' : '';
                  return (
                    <button
                      key={seat}
                      type="button"
                      title={seat}
                      aria-label={seat}
                      disabled={state === 'booked' || state === 'held'}
                      onClick={() => toggleSeat(seat)}
                      className={`seat ${state} ${i === aisleAfter ? 'aisle-gap' : ''}`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="d-flex flex-wrap justify-content-center gap-4 mt-3 small">
            <span>
              <span className="legend-box border border-success bg-white" /> Available
            </span>
            <span>
              <span className="legend-box bg-success" /> Selected
            </span>
            <span>
              <span className="legend-box border border-warning" style={{ background: '#fff3cd' }} /> Being booked
            </span>
            <span>
              <span className="legend-box bg-secondary-subtle" /> Booked
            </span>
          </div>
        </div>
      </div>

      <div className="card shadow-sm mt-3">
        <div className="card-body d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <div>
              Seats: <strong>{sortedSelection.length ? sortedSelection.join(', ') : 'none selected'}</strong>
            </div>
            <div className="fs-5">
              Total: <strong>{inr(selected.length * show.price)}</strong>{' '}
              <small className="text-muted">
                ({selected.length} × {inr(show.price)})
              </small>
            </div>
          </div>
          <button className="btn btn-danger btn-lg" disabled={!selected.length || busy} onClick={proceed}>
            {busy ? 'Holding seats...' : 'Proceed to pay'}
          </button>
        </div>
      </div>
    </>
  );
}
