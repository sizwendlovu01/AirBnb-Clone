import { useState } from 'react';

function Column({ title, items, moreText }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="things-to-know__column">
      <h4>{title}</h4>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {moreText && (
        <>
          {expanded && <p className="things-to-know__more-text">{moreText}</p>}
          <button type="button" className="things-to-know__toggle" onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Show less' : 'Show more'} ›
          </button>
        </>
      )}
    </div>
  );
}

// House rules / health & safety are generic policy text (this is a demo, not
// a real trust-and-safety system) but the cancellation deadline is genuinely
// computed from whatever check-in date the guest has selected.
export default function ThingsToKnow({ listing, checkIn }) {
  const houseRules = [
    'Check-in after 3:00 PM',
    'Checkout before 11:00 AM',
    listing.selfCheckIn ? 'Self check-in with lockbox' : 'Check in with the host',
    'No smoking',
    listing.amenities?.some((a) => /pet/i.test(a)) ? 'Pets allowed' : 'No pets',
    'No parties or events',
  ];

  const healthSafety = [
    listing.enhancedCleaning
      ? "Committed to Airbnb's enhanced cleaning process"
      : 'Standard cleaning between stays',
    "Airbnb's social-distancing and other COVID-19-related guidelines apply",
    'Carbon monoxide alarm',
    'Smoke alarm',
    `Security deposit: you may be charged up to $${listing.cleaningFee * 4} if you damage the home`,
  ];

  const cancellationDeadline = checkIn
    ? new Date(new Date(checkIn).getTime() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null;

  const cancellationPolicy = cancellationDeadline
    ? [`Free cancellation before ${cancellationDeadline}`]
    : ['Free cancellation for 48 hours after booking'];

  return (
    <section className="details-section things-to-know">
      <h3>Things to know</h3>
      <div className="things-to-know__grid">
        <Column
          title="House rules"
          items={houseRules}
          moreText="Guests staying beyond the listed occupancy without prior host approval may result in additional fees or cancellation."
        />
        <Column
          title="Health & safety"
          items={healthSafety}
          moreText="This host has agreed to Airbnb's standard safety practices, including working smoke and carbon monoxide alarms in every listing."
        />
        <Column
          title="Cancellation policy"
          items={cancellationPolicy}
          moreText="After the free cancellation period, this reservation is non-refundable, in line with the host's chosen cancellation policy."
        />
      </div>
    </section>
  );
}
