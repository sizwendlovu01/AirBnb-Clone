import { Link } from 'react-router-dom';
import { resolveImage } from '../../utils/resolveImage';

export default function LocationCard({ listing }) {
  const image = resolveImage(listing.images?.[0], listing._id || listing.title);

  return (
    <Link to={`/listings/${listing._id}`} className="location-card">
      <div className="location-card__image">
        <img src={image} alt={listing.title} loading="lazy" />
      </div>
      <div className="location-card__details">
        <p className="location-card__type">{listing.type}</p>
        <h3 className="location-card__name">{listing.title}</h3>
        <p className="location-card__amenities">
          {(listing.amenities || []).slice(0, 3).join(' · ') || 'No amenities listed'}
        </p>
        <p className="location-card__rating">
          ★ {listing.rating?.toFixed(1) ?? '4.5'} · {listing.reviews ?? 0} reviews
        </p>
        <p className="location-card__price">
          <strong>${listing.price}</strong> / night
        </p>
      </div>
    </Link>
  );
}
