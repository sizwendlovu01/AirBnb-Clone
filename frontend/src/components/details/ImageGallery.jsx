import { useState } from 'react';
import { resolveImage } from '../../utils/resolveImage';

export default function ImageGallery({ images = [], title }) {
  const [showAll, setShowAll] = useState(false);
  const pics = images.length ? images : [null, null, null, null, null];
  const [main, ...rest] = pics;
  const thumbnails = rest.slice(0, 4);
  while (thumbnails.length < 4) thumbnails.push(null);

  return (
    <div className="image-gallery">
      <div className="image-gallery__main">
        <img src={resolveImage(main, title, 0)} alt={title} />
      </div>
      <div className="image-gallery__grid">
        {thumbnails.map((img, i) => (
          <div key={i} className="image-gallery__thumb-wrapper">
            <img src={resolveImage(img, title, i + 1)} alt={`${title} ${i + 2}`} />
            {i === thumbnails.length - 1 && (
              <button
                type="button"
                className="image-gallery__show-all"
                onClick={() => setShowAll(true)}
              >
                Show all photos
              </button>
            )}
          </div>
        ))}
      </div>

      {showAll && (
        <div className="image-gallery__lightbox" onClick={() => setShowAll(false)}>
          <button
            type="button"
            className="image-gallery__lightbox-close"
            onClick={() => setShowAll(false)}
            aria-label="Close all photos"
          >
            ✕
          </button>
          <div className="image-gallery__lightbox-grid" onClick={(e) => e.stopPropagation()}>
            {pics.map((img, i) => (
              <img key={i} src={resolveImage(img, title, i)} alt={`${title} ${i + 1}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
