import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getAccommodations } from '../../api/accommodationApi';
import { destinations } from '../../data/destinations';
import { resolveImage } from '../../utils/resolveImage';
import './Header.css';

const MAX_DESTINATION_SUGGESTIONS = 6;
const MAX_LISTING_SUGGESTIONS = 4;

export default function Header() {
  const { user, isHost, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [listings, setListings] = useState([]);
  const menuRef = useRef(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Fetched once so the search box can suggest real, currently-available
  // listings (not just static destination names) as soon as it's focused.
  useEffect(() => {
    getAccommodations()
      .then(setListings)
      .catch(() => setListings([]));
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const query = search.trim().toLowerCase();

  const destinationMatches = useMemo(
    () =>
      destinations
        .filter((d) => !query || d.name.toLowerCase().includes(query))
        .slice(0, MAX_DESTINATION_SUGGESTIONS),
    [query]
  );

  const listingMatches = useMemo(
    () =>
      listings
        .filter(
          (l) =>
            !query ||
            l.title.toLowerCase().includes(query) ||
            l.location.toLowerCase().includes(query)
        )
        .slice(0, MAX_LISTING_SUGGESTIONS),
    [listings, query]
  );

  function handleSearch(e) {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/locations/${encodeURIComponent(search.trim())}`);
    }
    setShowSuggestions(false);
  }

  function handleSelectDestination(name) {
    setSearch('');
    setShowSuggestions(false);
    navigate(`/locations/${encodeURIComponent(name)}`);
  }

  function handleSelectListing(id) {
    setSearch('');
    setShowSuggestions(false);
    navigate(`/listings/${id}`);
  }

  function handleLogout() {
    logout();
    setMenuOpen(false);
    navigate('/');
  }

  const hasSuggestions = destinationMatches.length > 0 || listingMatches.length > 0;

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link to="/" className="site-header__logo">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true">
            <path d="M12.001 18.275c-1.353-1.697-2.148-3.184-2.413-4.457-.263-1.027-.16-1.848.291-2.465.477-.71 1.188-1.056 2.121-1.056s1.643.345 2.12 1.063c.446.61.558 1.432.286 2.465-.291 1.298-1.085 2.785-2.412 4.458zm9.601 1.14c-.185 1.246-1.034 2.28-2.2 2.783-2.253.98-4.483-.583-6.392-2.704 3.157-3.951 3.74-7.028 2.385-9.018-.795-1.14-1.933-1.695-3.394-1.695-2.944 0-4.563 2.49-3.927 5.382.37 1.565 1.352 3.343 2.917 5.332-.98 1.085-1.91 1.856-2.732 2.333-.636.344-1.245.558-1.828.609-2.679.399-4.778-2.2-3.825-4.88.132-.345.395-.98.845-1.961l.025-.053c1.464-3.178 3.242-6.79 5.285-10.795l.053-.132.58-1.116c.45-.822.635-1.19 1.351-1.643.346-.21.77-.315 1.246-.315.954 0 1.698.558 2.016 1.007.158.239.345.557.582.953l.558 1.089.08.159c2.041 4.004 3.821 7.608 5.279 10.794l.026.025.533 1.22.318.764c.243.613.294 1.222.213 1.858zm1.22-2.39c-.186-.583-.505-1.271-.9-2.094v-.03c-1.889-4.006-3.642-7.608-5.307-10.844l-.111-.163C15.317 1.461 14.468 0 12.001 0c-2.44 0-3.476 1.695-4.535 3.898l-.081.16c-1.669 3.236-3.421 6.843-5.303 10.847v.053l-.559 1.22c-.21.504-.317.768-.345.847C-.172 20.74 2.611 24 5.98 24c.027 0 .132 0 .265-.027h.372c1.75-.213 3.554-1.325 5.384-3.317 1.829 1.989 3.635 3.104 5.382 3.317h.372c.133.027.239.027.265.027 3.37.003 6.152-3.261 4.802-6.975z" />
          </svg>
          <span>airbnb</span>
        </Link>

        <div className="site-header__search-wrapper" ref={searchRef}>
          <form className="site-header__search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search destinations"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              aria-label="Search destinations"
              autoComplete="off"
            />
            <button type="submit" aria-label="Search">
              🔍
            </button>
          </form>

          {showSuggestions && (
            <div className="site-header__suggestions">
              {destinationMatches.length > 0 && (
                <div className="site-header__suggestions-group">
                  <p className="site-header__suggestions-label">Destinations</p>
                  {destinationMatches.map((d) => (
                    <button
                      key={d.name}
                      type="button"
                      className="site-header__suggestion"
                      onClick={() => handleSelectDestination(d.name)}
                    >
                      <span className="site-header__suggestion-icon">📍</span>
                      <span className="site-header__suggestion-text">
                        <span className="site-header__suggestion-title">{d.name}</span>
                        <span className="site-header__suggestion-subtitle">{d.subtitle}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {listingMatches.length > 0 && (
                <div className="site-header__suggestions-group">
                  <p className="site-header__suggestions-label">
                    {query ? 'Matching listings' : 'Available now'}
                  </p>
                  {listingMatches.map((l) => (
                    <button
                      key={l._id}
                      type="button"
                      className="site-header__suggestion"
                      onClick={() => handleSelectListing(l._id)}
                    >
                      <img
                        className="site-header__suggestion-thumb"
                        src={resolveImage(l.images?.[0], l._id)}
                        alt=""
                      />
                      <span className="site-header__suggestion-text">
                        <span className="site-header__suggestion-title">{l.title}</span>
                        <span className="site-header__suggestion-subtitle">
                          {l.location} · ${l.price}/night
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {!hasSuggestions && (
                <p className="site-header__suggestions-empty">
                  No destinations or listings match "{search}". Press enter to search anyway.
                </p>
              )}
            </div>
          )}
        </div>

        <nav className="site-header__nav">
          {!user && (
            <Link to="/login?mode=register&role=host" className="site-header__become-host">
              Become a host
            </Link>
          )}

          {!user && (
            <Link to="/login" className="btn btn-outline btn-sm">
              Log in
            </Link>
          )}

          {user && (
            <div className="site-header__profile" ref={menuRef}>
              <button
                className="site-header__profile-btn"
                onClick={() => setMenuOpen((o) => !o)}
              >
                <span className="site-header__greeting">Hi, {user.username.split(' ')[0]}</span>
                <span className="site-header__avatar">{user.username[0].toUpperCase()}</span>
              </button>

              {menuOpen && (
                <div className="site-header__dropdown">
                  {isHost && (
                    <Link to="/dashboard" onClick={() => setMenuOpen(false)}>
                      Host dashboard
                    </Link>
                  )}
                  <Link to="/reservations" onClick={() => setMenuOpen(false)}>
                    My reservations
                  </Link>
                  <button onClick={handleLogout}>Log out</button>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
