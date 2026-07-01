import { useEffect, useState } from 'react';
import { getHostReservations, cancelReservation } from '../../api/reservationApi';
import Spinner from '../../components/common/Spinner.jsx';

export default function HostReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getHostReservations()
      .then(setReservations)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleCancel(id) {
    if (!confirm('Cancel this reservation?')) return;
    try {
      await cancelReservation(id);
      setReservations((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <h1>Reservations on your listings</h1>

      {error && <div className="alert alert-error">{error}</div>}

      {reservations.length === 0 ? (
        <p>No reservations yet.</p>
      ) : (
        <table className="listing-table">
          <thead>
            <tr>
              <th>Listing</th>
              <th>Guest</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((r) => (
              <tr key={r._id}>
                <td>{r.accommodation?.title || 'Listing removed'}</td>
                <td>{r.user?.username}</td>
                <td>{new Date(r.checkIn).toLocaleDateString()}</td>
                <td>{new Date(r.checkOut).toLocaleDateString()}</td>
                <td>${r.priceBreakdown?.total}</td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => handleCancel(r._id)}>
                    Cancel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
