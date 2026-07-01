import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getAccommodations } from '../api/accommodationApi';
import LocationFilter from '../components/location/LocationFilter.jsx';
import LocationCard from '../components/location/LocationCard.jsx';
import Spinner from '../components/common/Spinner.jsx';
import '../components/location/Location.css';

export default function LocationPage() {
  const { location } = useParams();
  const [searchParams] = useSearchParams();
  const guests = searchParams.get('guests') || '';

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');

    const query = location === 'anywhere' ? {} : { location };
    if (guests) query.guests = guests;

    getAccommodations(query)
      .then(setListings)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [location, guests]);

  return (
    <div className="location-page container">
      <LocationFilter initialLocation={location === 'anywhere' ? '' : location} initialGuests={guests} />

      <h2 className="location-page__heading">
        {loading ? 'Searching…' : `${listings.length} stays in ${location === 'anywhere' ? 'all locations' : location}`}
      </h2>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <Spinner />
      ) : listings.length === 0 ? (
        <p className="location-page__empty">
          No listings found for this search. Try a different destination.
        </p>
      ) : (
        <div className="location-list">
          {listings.map((listing) => (
            <LocationCard key={listing._id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
