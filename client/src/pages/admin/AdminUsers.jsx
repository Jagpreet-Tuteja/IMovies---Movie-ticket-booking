import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/users').then((res) => setUsers(res.data));
  }, []);

  const q = search.toLowerCase();
  const visible = users.filter((u) => u.name.toLowerCase().includes(q) || u.email.includes(q));

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3 gap-2">
        <h3 className="mb-0">Customers</h3>
        <input className="form-control w-auto" placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>City</th>
                <th>Bookings</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((u) => (
                <tr key={u._id}>
                  <td className="fw-semibold">{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone || '-'}</td>
                  <td>{u.city || '-'}</td>
                  <td>{u.bookings}</td>
                  <td className="small">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
