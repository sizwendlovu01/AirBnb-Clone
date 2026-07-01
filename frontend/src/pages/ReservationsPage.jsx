import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyReservations, cancelReservation } from '../api/reservationApi';
import Spinner from '../components/common/Spinner.jsx';
import './Reservations.css';

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReservations();
  }, []);

  function loadReservations() {
    setLoading(true);
    getMyReservations()
      .then(setReservations)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

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
    <div className="reservations-page container">
      <h1>My reservations</h1>

      {error && <div className="alert alert-error">{error}</div>}

      {reservations.length === 0 ? (
        <p className="reservations-page__empty">
          You have no reservations yet. <Link to="/">Start exploring stays</Link>.
        </p>
      ) : (
        <table className="reservations-table">
          <thead>
            <tr>
              <th>Listing</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Guests</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((r) => (
              <tr key={r._id}>
                <td>
                  <Link to={`/listings/${r.accommodation?._id}`}>
                    {r.accommodation?.title || 'Listing removed'}
                  </Link>
                  <div className="reservations-table__location">{r.accommodation?.location}</div>
                </td>
                <td>{new Date(r.checkIn).toLocaleDateString()}</td>
                <td>{new Date(r.checkOut).toLocaleDateString()}</td>
                <td>{r.guests}</td>
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
