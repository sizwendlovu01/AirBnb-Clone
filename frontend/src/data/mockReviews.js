// The backend/database only stores aggregate rating data (rating, reviews
// count, specificRatings) — there's no per-review author/comment model.
// These illustrative reviews let the details page show individual review
// cards without inventing a whole review CRUD feature. They're deterministic
// per listing id (same listing always shows the same reviews) rather than
// re-randomized on every render.
const REVIEW_POOL = [
  { name: 'Jose', text: 'Host was very attentive.' },
  { name: 'Shayna', text: 'Wonderful neighborhood, easy access to restaurants and the subway, cozy studio apartment with a super comfortable bed. Great host, super helpful and responsive. Cool murphy bed...' },
  { name: 'Luke', text: 'Nice place to stay!' },
  { name: 'Josh', text: 'Well designed and fun space, neighborhood has lots of energy and amenities.' },
  { name: 'Vladko', text: 'This is amazing place. It has everything one needs for a monthly business stay. Very clean and organized place. Amazing hospitality affordable price.' },
  { name: 'Jennifer', text: 'A centric place, near of a sub station and a supermarket with everything you need.' },
  { name: 'Amelia', text: 'Exactly as pictured — bright, quiet, and an easy walk to everything.' },
  { name: 'Marcus', text: 'Check-in was seamless and the host responded to every message within minutes.' },
];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function reviewsForListing(listingId, count) {
  const seed = hashString(String(listingId));
  const rotated = [...REVIEW_POOL.slice(seed % REVIEW_POOL.length), ...REVIEW_POOL.slice(0, seed % REVIEW_POOL.length)];
  return rotated.slice(0, count).map((review, i) => {
    const monthsAgo = ((seed >> i) % 6) + 1;
    const date = new Date();
    date.setMonth(date.getMonth() - monthsAgo);
    return {
      ...review,
      date: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    };
  });
}
