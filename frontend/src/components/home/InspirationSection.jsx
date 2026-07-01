import { Link } from 'react-router-dom';
import { destinations, imageForSeed } from '../../data/destinations';

export default function InspirationSection() {
  return (
    <section className="home-section">
      <div className="container">
        <h2 className="home-section__title">Inspiration for your next trip</h2>
        <div className="destination-grid">
          {destinations.map((dest) => (
            <Link
              key={dest.name}
              to={`/locations/${encodeURIComponent(dest.name)}`}
              className="destination-card"
            >
              <img src={imageForSeed(dest.seed)} alt={dest.name} loading="lazy" />
              <div>
                <p className="destination-card__name">{dest.name}</p>
                <p className="destination-card__subtitle">{dest.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
