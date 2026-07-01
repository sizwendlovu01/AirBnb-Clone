// Superhost/identity-verified badges and response rate/time are illustrative
// — this app has no trust-and-safety or messaging system behind them, same
// as the reference design. "Contact Host" is genuinely functional though: it
// opens a real mailto to the host's actual account email.
export default function HostDetails({ host, listingTitle }) {
  const name = host?.username || 'Host';
  const joined = host?.createdAt
    ? new Date(host.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;
  const subject = encodeURIComponent(`Question about ${listingTitle || 'your listing'}`);

  return (
    <section className="details-section host-details">
      <div className="host-details__header">
        <div className="host-details__avatar">{name[0]?.toUpperCase()}</div>
        <div>
          <h3>Hosted by {name}</h3>
          {joined && <p className="host-details__joined">Joined {joined}</p>}
        </div>
      </div>

      <div className="host-details__stats">
        <span>12 Reviews</span>
        <span>Identity verified</span>
        <span>Superhost</span>
      </div>

      <p className="host-details__superhost-title">{name} is a Superhost</p>
      <p className="host-details__superhost-desc">
        Superhosts are experienced, highly rated hosts who are committed to providing great stays
        for guests.
      </p>

      <p className="host-details__meta">Response rate: 100%</p>
      <p className="host-details__meta">Response time: within an hour</p>

      <a className="btn btn-outline" href={`mailto:${host?.email || ''}?subject=${subject}`}>
        Contact Host
      </a>

      <p className="host-details__notice">
        To protect your payment, never transfer money or communicate outside of the Airbnb
        website or app.
      </p>
    </section>
  );
}
