import { useEffect, useState } from 'react';
import { getMyAccommodations, deleteAccommodation } from '../../api/accommodationApi';
import HotelListingCard from '../../components/admin/HotelListingCard.jsx';
import Spinner from '../../components/common/Spinner.jsx';

export default function ListingsPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadListings();
  }, []);

  function loadListings() {
    setLoading(true);
    getMyAccommodations()
      .then(setListings)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  async function handleDelete(id) {
    if (!confirm('Delete this listing? This cannot be undone.')) return;
    try {
      await deleteAccommodation(id);
      setListings((prev) => prev.filter((l) => l._id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 className="hotel-list__heading">My Hotel List</h1>
      <div className="hotel-list__divider" />

      {error && <div className="alert alert-error">{error}</div>}

      {listings.length === 0 ? (
        <p className="hotel-list__empty">You haven't created any listings yet.</p>
      ) : (
        listings.map((listing) => (
          <HotelListingCard key={listing._id} listing={listing} onDelete={handleDelete} />
        ))
      )}
    </div>
  );
}
