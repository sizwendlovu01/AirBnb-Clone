import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getAccommodation } from '../api/accommodationApi';
import ImageGallery from '../components/details/ImageGallery.jsx';
import CostCalculator from '../components/details/CostCalculator.jsx';
import AvailabilityCalendar from '../components/details/AvailabilityCalendar.jsx';
import ReviewsSection from '../components/details/ReviewsSection.jsx';
import HostDetails from '../components/details/HostDetails.jsx';
import ThingsToKnow from '../components/details/ThingsToKnow.jsx';
import ExploreMore from '../components/details/ExploreMore.jsx';
import Spinner from '../components/common/Spinner.jsx';
import { resolveImage } from '../utils/resolveImage';
import { iconForAmenity } from '../utils/amenityIcons';
import '../components/details/Details.css';

const SAVED_KEY = 'airbnb_saved_listings';
const AMENITIES_PREVIEW_COUNT = 6;
const DESCRIPTION_PREVIEW_LENGTH = 220;

function getSavedIds() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
  } catch {
    return [];
  }
}

export default function LocationDetailsPage() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);

  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [amenitiesExpanded, setAmenitiesExpanded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  useEffect(() => {
    setLoading(true);
    getAccommodation(id)
      .then((data) => {
        setListing(data);
        setSaved(getSavedIds().includes(data._id));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  function handleDatesChange(nextCheckIn, nextCheckOut) {
    setCheckIn(nextCheckIn);
    setCheckOut(nextCheckOut);
  }

  function toggleSaved() {
    const ids = getSavedIds();
    const next = saved ? ids.filter((i) => i !== listing._id) : [...ids, listing._id];
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    setSaved(!saved);
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: listing.title, url });
        return;
      } catch {
        // user cancelled the native share sheet — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareMessage('Link copied!');
      setTimeout(() => setShareMessage(''), 2000);
    } catch {
      setShareMessage('Could not copy link');
      setTimeout(() => setShareMessage(''), 2000);
    }
  }

  if (loading) return <Spinner />;
  if (error) return <div className="container"><div className="alert alert-error">{error}</div></div>;
  if (!listing) return null;

  const bedroomImage = listing.images?.[2] || listing.images?.[0];
  const visibleAmenities = amenitiesExpanded
    ? listing.amenities
    : listing.amenities.slice(0, AMENITIES_PREVIEW_COUNT);
  const descriptionIsLong = listing.description.length > DESCRIPTION_PREVIEW_LENGTH;
  const visibleDescription =
    descriptionExpanded || !descriptionIsLong
      ? listing.description
      : `${listing.description.slice(0, DESCRIPTION_PREVIEW_LENGTH)}...`;

  return (
    <>
    <div className="details-page container">
      <div className="details-page__heading">
        <div className="details-page__heading-row">
          <h1>{listing.title}</h1>
          <div className="details-page__heading-actions">
            <button type="button" onClick={handleShare}>
              Share
            </button>
            <button type="button" onClick={toggleSaved}>
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
        {shareMessage && <p className="details-page__share-message">{shareMessage}</p>}
        <p className="details-page__meta">
          {listing.rating?.toFixed(1) ?? '4.5'} · <span className="details-page__meta-link">{listing.reviews ?? 0} reviews</span>
          {' · '}Superhost{' · '}
          <span className="details-page__meta-link">{listing.location}</span>
        </p>
      </div>

      <ImageGallery images={listing.images} title={listing.title} />

      <div className="details-page__columns">
        <div className="details-page__left">
          <section className="details-section">
            <div className="details-page__host-row">
              <div>
                <h2>{listing.type} hosted by {listing.host?.username || 'a host'}</h2>
                <p className="details-page__stats">
                  {listing.guests} guests · {listing.bedrooms} bedroom{listing.bedrooms !== 1 ? 's' : ''} ·{' '}
                  {listing.bedrooms} bed{listing.bedrooms !== 1 ? 's' : ''} · {listing.bathrooms} bath
                  {listing.bathrooms !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="details-page__host-avatar">
                {listing.host?.username?.[0]?.toUpperCase() || 'H'}
              </div>
            </div>

            <ul className="feature-highlights">
              <li>
                <span>
                  <strong>{listing.type}</strong>
                  <p>You'll have the {listing.type.replace(/^Entire /i, '').toLowerCase() || 'place'} to yourself</p>
                </span>
              </li>
              {listing.enhancedCleaning && (
                <li>
                  <span>
                    <strong>Enhanced Clean</strong>
                    <p>This host committed to Airbnb's 5-step enhanced cleaning process.</p>
                  </span>
                </li>
              )}
              {listing.selfCheckIn && (
                <li>
                  <span>
                    <strong>Self check-in</strong>
                    <p>Check yourself in with the keypad.</p>
                  </span>
                </li>
              )}
              <li>
                <span>
                  <strong>Free cancellation</strong>
                  <p>Free cancellation for 48 hours after booking.</p>
                </span>
              </li>
            </ul>

            <p className="details-page__description">{visibleDescription}</p>
            {descriptionIsLong && (
              <button
                type="button"
                className="details-page__show-more"
                onClick={() => setDescriptionExpanded((v) => !v)}
              >
                {descriptionExpanded ? 'Show less' : 'Show more'} ›
              </button>
            )}
          </section>

          <section className="details-section">
            <h3>Where you'll sleep</h3>
            <div className="sleep-card">
              <img src={resolveImage(bedroomImage, listing._id, 2)} alt="Bedroom" />
              <p>Bedroom</p>
              <p className="sleep-card__meta">1 queen bed</p>
            </div>
          </section>

          <section className="details-section">
            <h3>What this place offers</h3>
            <ul className="amenities-list">
              {visibleAmenities.length ? (
                visibleAmenities.map((a) => (
                  <li key={a}>
                    <span className="amenities-list__icon">{iconForAmenity(a)}</span> {a}
                  </li>
                ))
              ) : (
                <li>No amenities listed</li>
              )}
            </ul>
            {listing.amenities.length > AMENITIES_PREVIEW_COUNT && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setAmenitiesExpanded((v) => !v)}
              >
                {amenitiesExpanded ? 'Show less' : `Show all ${listing.amenities.length} amenities`}
              </button>
            )}
          </section>

          <section className="details-section">
            <h3>
              {checkIn && checkOut ? '' : '7 nights in '}
              {listing.location}
            </h3>
            {checkIn && checkOut && (
              <p className="details-page__date-range">
                {new Date(checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} -{' '}
                {new Date(checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            )}
            <AvailabilityCalendar checkIn={checkIn} checkOut={checkOut} onChange={handleDatesChange} />
          </section>

          <ReviewsSection
            listingId={listing._id}
            rating={listing.rating}
            reviews={listing.reviews}
            specificRatings={listing.specificRatings}
          />

          <HostDetails host={listing.host} listingTitle={listing.title} />

          <ThingsToKnow listing={listing} checkIn={checkIn} />
        </div>

        <div className="details-page__right">
          <CostCalculator
            listing={listing}
            checkIn={checkIn}
            checkOut={checkOut}
            onDatesChange={handleDatesChange}
            guests={guests}
            onGuestsChange={setGuests}
          />
        </div>
      </div>
    </div>

    <ExploreMore currentLocation={listing.location} />
    </>
  );
}
