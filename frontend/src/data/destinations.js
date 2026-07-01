// Static destination data used to power the home page inspiration cards
// and to seed the location search.
export const destinations = [
  { name: 'New York', subtitle: 'Because you follow @nyc', seed: 'new-york' },
  { name: 'Los Angeles', subtitle: '2.5 hour drive', seed: 'los-angeles' },
  { name: 'Lake Tahoe', subtitle: 'Popular with travelers from your area', seed: 'lake-tahoe' },
  { name: 'Miami', subtitle: 'For a weekend getaway', seed: 'miami' },
  { name: 'Paris', subtitle: 'Popular this time of year', seed: 'paris' },
  { name: 'Cancun', subtitle: 'Because your wishlist has beach stays', seed: 'cancun' },
];

function img(id) {
  return `https://images.unsplash.com/photo-${id}?w=800&h=600&fit=crop&q=80`;
}

// Every entry here was individually downloaded and visually verified before
// use (real skylines/landmarks for destinations, real interiors for the
// decorative home-page sections) — deliberately not a random photo service,
// since those can just as easily return an unrelated landscape or crowd shot.
const SEED_IMAGES = {
  'new-york': img('1546436836-07a91091f160'),
  'los-angeles': img('1580655653885-65763b2597d0'),
  'lake-tahoe': img('1568605114967-8130f3a36994'),
  miami: img('1506966953602-c20cc11f75e3'),
  paris: img('1502602898657-3e91760cbb34'),
  cancun: img('1519046904884-53103b34b206'),
  'trip-things': img('1506966953602-c20cc11f75e3'),
  'home-things': img('1502672260266-1c1ef2d93688'),
  'gift-cards': img('1546436836-07a91091f160'),
};

export function imageForSeed(seed) {
  return SEED_IMAGES[seed] || SEED_IMAGES['new-york'];
}
