import { Link } from 'react-router-dom';
import { destinations } from '../../data/destinations';

const COUNTRY_BY_CITY = {
  'New York': 'the United States',
  'Los Angeles': 'the United States',
  Austin: 'the United States',
  Seattle: 'the United States',
  Miami: 'the United States',
  'Lake Tahoe': 'the United States',
  Paris: 'France',
  Cancun: 'Mexico',
};

// No real property-type filter exists yet, so each "unique stay" category
// leads to the same real destination — browsing every available stay —
// rather than a link that goes nowhere.
const UNIQUE_STAYS = [
  'Beach House Rentals',
  'Cabin Rentals',
  'Camper Rentals',
  'Glamping Rentals',
  'Treehouse Rentals',
  'Tiny House Rentals',
  'Lakehouse Rentals',
  'Mountain Chalet Rentals',
];

export default function ExploreMore({ currentLocation }) {
  const country = COUNTRY_BY_CITY[currentLocation] || currentLocation;
  const otherDestinations = destinations.filter((d) => d.name !== currentLocation);

  return (
    <section className="explore-more">
      <div className="container">
        <h3>Explore other options in {country}</h3>
        <div className="explore-more__grid">
          {otherDestinations.map((dest) => (
            <Link key={dest.name} to={`/locations/${encodeURIComponent(dest.name)}`}>
              {dest.name}
            </Link>
          ))}
        </div>

        <h3 className="explore-more__subheading">Unique stays on Airbnb</h3>
        <div className="explore-more__grid">
          {UNIQUE_STAYS.map((stay) => (
            <Link key={stay} to="/locations/anywhere">
              {stay}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
