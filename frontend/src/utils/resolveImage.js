const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Verified real-estate photos (exteriors/interiors, individually checked —
// no random stock photography) used when a listing has no images of its own,
// e.g. a freshly created listing whose upload failed or was skipped.
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800&h=600&fit=crop&q=80',
];

// Accommodation images are stored either as absolute URLs, static /images
// paths shipped with the frontend, or /uploads paths served by the backend.
export function resolveImage(src, fallbackSeed = 'listing', fallbackIndex = 0) {
  if (!src) {
    const hash = String(fallbackSeed)
      .split('')
      .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    return FALLBACK_IMAGES[(hash + fallbackIndex) % FALLBACK_IMAGES.length];
  }
  if (src.startsWith('http') || src.startsWith('/images')) return src;
  if (src.startsWith('/uploads')) return `${API_URL}${src}`;
  return src;
}
