import { Link } from 'react-router-dom';
import { resolveImage } from '../../utils/resolveImage';

function StarIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="#f5a623" aria-hidden="true">
      <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.8L10 14.77l-5.2 2.74.99-5.8-4.21-4.1 5.82-.85z" />
    </svg>
  );
}

function titleCase(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export default function HotelListingCard({ listing, onDelete }) {
  return (
    <div className="hotel-card">
      <div className="hotel-card__media">
        <img src={resolveImage(listing.images?.[0], listing._id)} alt={listing.title} />
        <div className="hotel-card__actions">
          <Link to={`/dashboard/listings/${listing._id}/edit`} className="hotel-card__btn hotel-card__btn--update">
            Update
          </Link>
          <button
            type="button"
            className="hotel-card__btn hotel-card__btn--delete"
            onClick={() => onDelete(listing._id)}
          >
            Delete
          </button>
        </div>
      </div>

      <div className="hotel-card__details">
        <p className="hotel-card__subtitle">
          {listing.type} in {listing.location}
        </p>
        <h3 className="hotel-card__title">{listing.title}</h3>

        <div className="hotel-card__divider" />

        <p className="hotel-card__stats">
          {listing.guests} guests · {listing.type} · {listing.bedrooms} beds · {listing.bathrooms} bath
        </p>
        {listing.amenities?.length > 0 && (
          <p className="hotel-card__amenities">{listing.amenities.map(titleCase).join(' · ')}</p>
        )}

        <div className="hotel-card__divider" />

        <p className="hotel-card__rating">
          <span>{listing.rating?.toFixed(1) ?? '4.5'}</span>
          <StarIcon />
          <span className="hotel-card__reviews">({listing.reviews ?? 0} reviews)</span>
        </p>
      </div>

      <div className="hotel-card__price">
        <strong>${listing.price}</strong>
        <span> /night</span>
      </div>
    </div>
  );
}
