import { Link } from 'react-router-dom';
import { imageForSeed } from '../../data/destinations';

// No real gift-card checkout exists in this app, so the button leads to the
// one real place a gift card would actually be spent: browsing stays.
export default function ShopAirbnbSection() {
  return (
    <section className="home-section">
      <div className="container shop-airbnb">
        <div className="shop-airbnb__text">
          <h2>Shop Airbnb gift cards</h2>
          <p>For any occasion. For any amount. Send a gift card that pays for a stay anywhere.</p>
          <Link to="/locations/anywhere" className="btn btn-primary">
            Shop gift cards
          </Link>
        </div>
        <div className="shop-airbnb__image">
          <img src={imageForSeed('gift-cards', 3)} alt="Airbnb gift cards" />
        </div>
      </div>
    </section>
  );
}
