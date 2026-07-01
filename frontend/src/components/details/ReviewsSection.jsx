import { useMemo, useState } from 'react';
import { reviewsForListing } from '../../data/mockReviews';

const LABELS = {
  cleanliness: 'Cleanliness',
  communication: 'Communication',
  checkIn: 'Check-in',
  accuracy: 'Accuracy',
  location: 'Location',
  value: 'Value',
};

const PREVIEW_COUNT = 4;

export default function ReviewsSection({ listingId, rating, reviews, specificRatings = {} }) {
  const [showAll, setShowAll] = useState(false);

  const allReviews = useMemo(
    () => reviewsForListing(listingId, Math.min(reviews || 0, 8)),
    [listingId, reviews]
  );
  const visibleReviews = showAll ? allReviews : allReviews.slice(0, PREVIEW_COUNT);

  return (
    <section className="details-section">
      <h3>{rating?.toFixed(1) ?? '4.5'} · {reviews ?? 0} reviews</h3>
      <div className="reviews-grid">
        {Object.entries(LABELS).map(([key, label]) => (
          <div key={key} className="reviews-grid__item">
            <span>{label}</span>
            <div className="reviews-grid__bar">
              <div
                className="reviews-grid__bar-fill"
                style={{ width: `${((specificRatings[key] ?? 4.5) / 5) * 100}%` }}
              />
            </div>
            <span>{(specificRatings[key] ?? 4.5).toFixed(1)}</span>
          </div>
        ))}
      </div>

      {allReviews.length > 0 && (
        <>
          <div className="review-cards">
            {visibleReviews.map((review, i) => (
              <div key={i} className="review-card">
                <div className="review-card__avatar">{review.name[0]}</div>
                <div className="review-card__body">
                  <p className="review-card__name">{review.name}</p>
                  <p className="review-card__date">{review.date}</p>
                  <p className="review-card__text">{review.text}</p>
                </div>
              </div>
            ))}
          </div>

          {allReviews.length > PREVIEW_COUNT && (
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowAll((v) => !v)}>
              {showAll ? 'Show fewer reviews' : `Show all ${allReviews.length} reviews`}
            </button>
          )}
        </>
      )}
    </section>
  );
}
