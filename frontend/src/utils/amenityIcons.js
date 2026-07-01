// Amenities are free-text strings set by the host, not a fixed enum, so this
// maps common keywords to a representative icon and falls back to a generic
// check for anything unrecognized rather than showing nothing.
const ICON_MAP = [
  [/wifi/i, '📶'],
  [/kitchen/i, '🍳'],
  [/parking/i, '🚗'],
  [/pool/i, '🏊'],
  [/air ?condition/i, '❄️'],
  [/washer/i, '🧺'],
  [/dryer/i, '🌀'],
  [/fireplace/i, '🔥'],
  [/lake/i, '🚤'],
  [/beach/i, '🏖️'],
  [/gym/i, '🏋️'],
  [/pet/i, '🐾'],
  [/security|camera/i, '📷'],
  [/garden|view/i, '🪟'],
  [/fridge|refrigerator/i, '🧊'],
  [/bicycle|bike/i, '🚲'],
  [/tv|television/i, '📺'],
  [/heating/i, '🌡️'],
  [/workspace|desk/i, '💻'],
];

export function iconForAmenity(amenity) {
  const match = ICON_MAP.find(([pattern]) => pattern.test(amenity));
  return match ? match[1] : '✓';
}
