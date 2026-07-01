import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LocationFilter({ initialLocation = '', initialGuests = '' }) {
  const [location, setLocation] = useState(initialLocation);
  const [guests, setGuests] = useState(initialGuests);
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    const target = location.trim() || 'anywhere';
    const params = guests ? `?guests=${guests}` : '';
    navigate(`/locations/${encodeURIComponent(target)}${params}`);
  }

  return (
    <form className="location-filter" onSubmit={handleSubmit}>
      <div className="location-filter__field">
        <label htmlFor="location-input">Where</label>
        <input
          id="location-input"
          type="text"
          placeholder="Search destinations"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      <div className="location-filter__field">
        <label htmlFor="guests-input">Guests</label>
        <input
          id="guests-input"
          type="number"
          min="1"
          placeholder="Add guests"
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
        />
      </div>

      <button type="submit" className="btn btn-primary">
        Search
      </button>
    </form>
  );
}
