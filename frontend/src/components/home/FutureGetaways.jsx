import { useState } from 'react';
import { Link } from 'react-router-dom';
import { destinations } from '../../data/destinations';

const tabs = ['Popular', 'Arts and culture', 'Outdoors', 'Beachfront'];

export default function FutureGetaways() {
  const [activeTab, setActiveTab] = useState(tabs[0]);

  return (
    <section className="home-section home-section--muted">
      <div className="container">
        <h2 className="home-section__title">Inspiration for future getaways</h2>

        <div className="getaway-tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`getaway-tabs__tab ${tab === activeTab ? 'is-active' : ''}`}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Popular' ? (
          <ul className="getaway-list">
            {destinations.map((dest) => (
              <li key={dest.name}>
                <Link to={`/locations/${encodeURIComponent(dest.name)}`} className="getaway-list__link">
                  <span>{dest.name}</span>
                  <span className="getaway-list__meta">{dest.subtitle}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="getaway-placeholder">
            No {activeTab.toLowerCase()} getaways to show yet — check back soon.
          </p>
        )}
      </div>
    </section>
  );
}
