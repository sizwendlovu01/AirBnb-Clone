import { Link } from 'react-router-dom';

// Individually verified beachfront-bungalow photo (see the image-sourcing
// discussion elsewhere in this codebase) — a real dwelling, not a random
// landscape, matching the "getaways" copy below it.
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1600&h=900&fit=crop&q=80';

export default function HeroBanner() {
  return (
    <section className="hero-banner" style={{ backgroundImage: `url(${HERO_IMAGE})` }}>
      <div className="hero-banner__overlay" />
      <div className="container hero-banner__inner">
        <h1>Not sure where to go? Perfect.</h1>
        <p>Explore homes, experiences and getaways handpicked for every kind of trip.</p>
        <Link to="/locations/New%20York" className="btn btn-primary">
          Start exploring
        </Link>
      </div>
    </section>
  );
}
