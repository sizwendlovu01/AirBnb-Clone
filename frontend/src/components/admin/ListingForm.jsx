import { useState } from 'react';
import { resolveImage } from '../../utils/resolveImage';

// Must match backend/middleware/upload.js and the MAX_IMAGES_PER_LISTING
// cap in accommodationController.js — images are stored as base64 data URIs
// on the document (no disk/object storage), so these keep documents safely
// under MongoDB's 16MB limit.
const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE_MB = 1.5;

const PROPERTY_TYPES = [
  'Entire apartment',
  'Entire house',
  'Entire studio',
  'Entire cabin',
  'Private room',
  'Shared room',
];

const emptyForm = {
  title: '',
  location: '',
  description: '',
  bedrooms: '',
  bathrooms: '',
  guests: '',
  type: PROPERTY_TYPES[0],
  price: '',
  amenities: '',
  weeklyDiscount: '0',
  cleaningFee: '0',
  serviceFee: '0',
  occupancyTaxes: '0',
  enhancedCleaning: false,
  selfCheckIn: false,
};

// Shared by CreateListingPage and EditListingPage: same fields, same
// validation, same submit shape. Edit mode is just Create mode pre-seeded
// via `initialValues`/`existingImages` and a different onSubmit handler.
export default function ListingForm({
  initialValues,
  existingImages = [],
  onSubmit,
  submitting,
  submitLabel = 'Save listing',
  serverError = '',
}) {
  const [form, setForm] = useState({ ...emptyForm, ...initialValues });
  // Images are tracked as two separate lists so edits can drop a previously
  // uploaded image (keptImages) independently of adding brand new files
  // (newFiles) — both get merged back into one array server-side.
  const [keptImages, setKeptImages] = useState(existingImages);
  const [newFiles, setNewFiles] = useState([]);
  const [errors, setErrors] = useState({});

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate() {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.location.trim()) errs.location = 'Location is required';
    if (!form.description.trim() || form.description.trim().length < 20) {
      errs.description = 'Description must be at least 20 characters';
    }
    if (form.bedrooms === '' || Number(form.bedrooms) < 0) errs.bedrooms = 'Enter a valid number of bedrooms';
    if (form.bathrooms === '' || Number(form.bathrooms) < 0) errs.bathrooms = 'Enter a valid number of bathrooms';
    if (!form.guests || Number(form.guests) < 1) errs.guests = 'Must accommodate at least 1 guest';
    if (!form.price || Number(form.price) <= 0) errs.price = 'Enter a valid nightly price';
    if (Number(form.weeklyDiscount) < 0 || Number(form.weeklyDiscount) > 100) {
      errs.weeklyDiscount = 'Discount must be between 0 and 100';
    }
    if (keptImages.length === 0 && newFiles.length === 0) {
      errs.images = 'Add at least one image';
    } else if (keptImages.length + newFiles.length > MAX_IMAGES) {
      errs.images = `You can have at most ${MAX_IMAGES} images per listing`;
    } else if (newFiles.some((f) => f.size > MAX_IMAGE_SIZE_MB * 1024 * 1024)) {
      errs.images = `Each image must be under ${MAX_IMAGE_SIZE_MB}MB`;
    }
    return errs;
  }

  function handleFileChange(e) {
    setNewFiles(Array.from(e.target.files || []));
  }

  function removeExistingImage(url) {
    setKeptImages((prev) => prev.filter((i) => i !== url));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    onSubmit({
      ...form,
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      guests: Number(form.guests),
      price: Number(form.price),
      weeklyDiscount: Number(form.weeklyDiscount),
      cleaningFee: Number(form.cleaningFee),
      serviceFee: Number(form.serviceFee),
      occupancyTaxes: Number(form.occupancyTaxes),
      amenities: form.amenities
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
      existingImages: keptImages,
      newImages: newFiles,
    });
  }

  return (
    <form className="listing-form" onSubmit={handleSubmit} noValidate>
      {serverError && <div className="alert alert-error">{serverError}</div>}

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Title</label>
          <input
            className={`form-input ${errors.title ? 'has-error' : ''}`}
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
          />
          {errors.title && <p className="form-error">{errors.title}</p>}
        </div>

        <div className="form-group">
          <label className="form-label">Location</label>
          <input
            className={`form-input ${errors.location ? 'has-error' : ''}`}
            value={form.location}
            onChange={(e) => setField('location', e.target.value)}
          />
          {errors.location && <p className="form-error">{errors.location}</p>}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea
          className={`form-textarea ${errors.description ? 'has-error' : ''}`}
          rows={4}
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
        />
        {errors.description && <p className="form-error">{errors.description}</p>}
      </div>

      <div className="form-row form-row--three">
        <div className="form-group">
          <label className="form-label">Bedrooms</label>
          <input
            type="number"
            min="0"
            className={`form-input ${errors.bedrooms ? 'has-error' : ''}`}
            value={form.bedrooms}
            onChange={(e) => setField('bedrooms', e.target.value)}
          />
          {errors.bedrooms && <p className="form-error">{errors.bedrooms}</p>}
        </div>
        <div className="form-group">
          <label className="form-label">Bathrooms</label>
          <input
            type="number"
            min="0"
            className={`form-input ${errors.bathrooms ? 'has-error' : ''}`}
            value={form.bathrooms}
            onChange={(e) => setField('bathrooms', e.target.value)}
          />
          {errors.bathrooms && <p className="form-error">{errors.bathrooms}</p>}
        </div>
        <div className="form-group">
          <label className="form-label">Max guests</label>
          <input
            type="number"
            min="1"
            className={`form-input ${errors.guests ? 'has-error' : ''}`}
            value={form.guests}
            onChange={(e) => setField('guests', e.target.value)}
          />
          {errors.guests && <p className="form-error">{errors.guests}</p>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Property type</label>
          <select
            className="form-select"
            value={form.type}
            onChange={(e) => setField('type', e.target.value)}
          >
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Price per night ($)</label>
          <input
            type="number"
            min="1"
            className={`form-input ${errors.price ? 'has-error' : ''}`}
            value={form.price}
            onChange={(e) => setField('price', e.target.value)}
          />
          {errors.price && <p className="form-error">{errors.price}</p>}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Amenities (comma separated)</label>
        <input
          className="form-input"
          placeholder="wifi, kitchen, free parking"
          value={form.amenities}
          onChange={(e) => setField('amenities', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Images</label>
        <p className="form-hint">Up to {MAX_IMAGES} images, {MAX_IMAGE_SIZE_MB}MB each</p>
        <input type="file" accept="image/*" multiple onChange={handleFileChange} />
        {errors.images && <p className="form-error">{errors.images}</p>}

        {(keptImages.length > 0 || newFiles.length > 0) && (
          <div className="listing-form__previews">
            {keptImages.map((url) => (
              <div key={url} className="listing-form__preview">
                <img src={resolveImage(url)} alt="" />
                <button type="button" onClick={() => removeExistingImage(url)}>
                  &times;
                </button>
              </div>
            ))}
            {newFiles.map((file, i) => (
              <div key={i} className="listing-form__preview">
                <img src={URL.createObjectURL(file)} alt="" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="form-row form-row--four">
        <div className="form-group">
          <label className="form-label">Weekly discount (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            className={`form-input ${errors.weeklyDiscount ? 'has-error' : ''}`}
            value={form.weeklyDiscount}
            onChange={(e) => setField('weeklyDiscount', e.target.value)}
          />
          {errors.weeklyDiscount && <p className="form-error">{errors.weeklyDiscount}</p>}
        </div>
        <div className="form-group">
          <label className="form-label">Cleaning fee ($)</label>
          <input
            type="number"
            min="0"
            className="form-input"
            value={form.cleaningFee}
            onChange={(e) => setField('cleaningFee', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Service fee ($)</label>
          <input
            type="number"
            min="0"
            className="form-input"
            value={form.serviceFee}
            onChange={(e) => setField('serviceFee', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Occupancy taxes ($)</label>
          <input
            type="number"
            min="0"
            className="form-input"
            value={form.occupancyTaxes}
            onChange={(e) => setField('occupancyTaxes', e.target.value)}
          />
        </div>
      </div>

      <div className="form-row">
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={form.enhancedCleaning}
            onChange={(e) => setField('enhancedCleaning', e.target.checked)}
          />
          Enhanced cleaning
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={form.selfCheckIn}
            onChange={(e) => setField('selfCheckIn', e.target.checked)}
          />
          Self check-in
        </label>
      </div>

      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
