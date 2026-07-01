import { Link } from 'react-router-dom';
import './Footer.css';

// Each entry maps to a real route where one exists in this app; entries with
// no `to` are rendered as plain text rather than a link that goes nowhere —
// this is a demo clone, not the real Airbnb, so most marketing/support pages
// (Careers, Newsroom, Help Center, etc.) genuinely don't exist here.
const columns = [
  {
    title: 'Support',
    links: [
      { label: 'Help Center' },
      { label: 'AirCover' },
      { label: 'Anti-discrimination' },
      { label: 'Disability support' },
      { label: 'Cancellation options', to: '/reservations' },
    ],
  },
  {
    title: 'Hosting',
    links: [
      { label: 'Airbnb your home', to: '/login' },
      { label: 'AirCover for Hosts' },
      { label: 'Hosting resources' },
      { label: 'Community forum' },
      { label: 'Responsible hosting' },
    ],
  },
  {
    title: 'Airbnb',
    links: [
      { label: 'Newsroom' },
      { label: 'New features' },
      { label: 'Careers' },
      { label: 'Investors' },
      { label: 'Gift cards', to: '/locations/anywhere' },
    ],
  },
  {
    title: 'Explore',
    links: [
      { label: 'New York', to: '/locations/New York' },
      { label: 'Los Angeles', to: '/locations/Los Angeles' },
      { label: 'Lake Tahoe', to: '/locations/Lake Tahoe' },
      { label: 'Miami', to: '/locations/Miami' },
      { label: 'Paris', to: '/locations/Paris' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__columns">
        {columns.map((col) => (
          <div key={col.title} className="site-footer__column">
            <h4>{col.title}</h4>
            <ul>
              {col.links.map((link) => (
                <li key={link.label}>
                  {link.to ? (
                    <Link to={link.to}>{link.label}</Link>
                  ) : (
                    <span className="site-footer__static-link">{link.label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="site-footer__bottom">
        <div className="container site-footer__bottom-inner">
          <p>&copy; {new Date().getFullYear()} Airbnb Clone, Inc. All rights reserved.</p>

          <div className="site-footer__meta">
            <span>🌐 English (US)</span>
            <span>$ USD</span>
            <div className="site-footer__social">
              <span aria-label="Facebook">f</span>
              <span aria-label="Twitter">x</span>
              <span aria-label="Instagram">ig</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
