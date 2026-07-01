import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { createReservation } from '../../api/reservationApi';

const MS_PER_NIGHT = 24 * 60 * 60 * 1000;

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
}

// Controlled by LocationDetailsPage so the mid-page availability calendar and
// this sticky booking panel always show the same selected date range.
export default function CostCalculator({ listing, checkIn, checkOut, onDatesChange, guests, onGuestsChange }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const diff = new Date(checkOut) - new Date(checkIn);
    return diff > 0 ? Math.round(diff / MS_PER_NIGHT) : 0;
  }, [checkIn, checkOut]);

  // Preview only — this mirrors the same formula the backend uses in
  // reservationController.computePriceBreakdown, so the guest sees the real
  // total before booking, but the server recomputes it from the listing's
  // live price/fees at booking time rather than trusting this client value.
  const breakdown = useMemo(() => {
    const subtotal = listing.price * nights;
    const weeklyDiscountAmount =
      nights >= 7 ? Math.round(subtotal * (listing.weeklyDiscount / 100)) : 0;
    const total =
      subtotal -
      weeklyDiscountAmount +
      listing.cleaningFee +
      listing.serviceFee +
      listing.occupancyTaxes;
    return { subtotal, weeklyDiscountAmount, total };
  }, [listing, nights]);

  async function handleReserve(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!user) {
      navigate('/login', { state: { from: { pathname: window.location.pathname } } });
      return;
    }
    if (!checkIn || !checkOut) {
      setError('Please choose a check-in and check-out date');
      return;
    }
    if (nights <= 0) {
      setError('Check-out date must be after check-in date');
      return;
    }
    if (guests > listing.guests) {
      setError(`This listing only allows up to ${listing.guests} guests`);
      return;
    }

    try {
      setSubmitting(true);
      await createReservation({
        accommodationId: listing._id,
        checkIn,
        checkOut,
        guests,
      });
      setSuccess('Reservation confirmed! View it under "My reservations".');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const reportSubject = encodeURIComponent(`Reporting listing: ${listing.title}`);

  return (
    <form className="cost-calculator" onSubmit={handleReserve}>
      <div className="cost-calculator__heading">
        <div className="cost-calculator__price">
          <strong>${listing.price}</strong> <span>/ night</span>
        </div>
        <div className="cost-calculator__rating">
          {listing.rating?.toFixed(1) ?? '4.5'} · <span>{listing.reviews ?? 0} reviews</span>
        </div>
      </div>

      <div className="cost-calculator__dates">
        <div>
          <label htmlFor="check-in">Check-in</label>
          <input
            id="check-in"
            type="date"
            min={todayISO()}
            value={checkIn}
            onChange={(e) => onDatesChange(e.target.value, checkOut)}
            required
          />
        </div>
        <div>
          <label htmlFor="check-out">Check-out</label>
          <input
            id="check-out"
            type="date"
            min={checkIn || todayISO()}
            value={checkOut}
            onChange={(e) => onDatesChange(checkIn, e.target.value)}
            required
          />
        </div>
      </div>

      <div className="cost-calculator__guests">
        <label htmlFor="guests">Guests</label>
        <select
          id="guests"
          value={guests}
          onChange={(e) => onGuestsChange(Number(e.target.value))}
        >
          {Array.from({ length: listing.guests }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} guest{n > 1 ? 's' : ''}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
        {submitting ? 'Reserving…' : user ? 'Reserve' : 'Log in to reserve'}
      </button>

      <p className="cost-calculator__disclaimer">You won't be charged yet</p>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {nights > 0 && (
        <div className="cost-calculator__breakdown">
          <div className="cost-calculator__row">
            <span>
              ${listing.price} x {nights} night{nights > 1 ? 's' : ''}
              {checkIn && checkOut && (
                <span className="cost-calculator__date-range">
                  {' '}
                  ({formatDate(checkIn)} to {formatDate(checkOut)})
                </span>
              )}
            </span>
            <span>${breakdown.subtotal}</span>
          </div>
          {breakdown.weeklyDiscountAmount > 0 && (
            <div className="cost-calculator__row cost-calculator__row--discount">
              <span>Weekly discount</span>
              <span>-${breakdown.weeklyDiscountAmount}</span>
            </div>
          )}
          <div className="cost-calculator__row">
            <span>Cleaning fee</span>
            <span>${listing.cleaningFee}</span>
          </div>
          <div className="cost-calculator__row">
            <span>Service fee</span>
            <span>${listing.serviceFee}</span>
          </div>
          <div className="cost-calculator__row">
            <span>Occupancy taxes and fees</span>
            <span>${listing.occupancyTaxes}</span>
          </div>
          <div className="cost-calculator__row cost-calculator__row--total">
            <span>Total</span>
            <span>${breakdown.total}</span>
          </div>
        </div>
      )}

      <a
        className="cost-calculator__report"
        href={`mailto:support@airbnb-clone.example?subject=${reportSubject}`}
      >
        Report this listing
      </a>
    </form>
  );
}
