const Accommodation = require('../models/Accommodation');
const Reservation = require('../models/Reservation');

const REQUIRED_FIELDS = [
  'title',
  'location',
  'description',
  'bedrooms',
  'bathrooms',
  'guests',
  'type',
  'price',
];

function validatePayload(body) {
  const errors = {};
  REQUIRED_FIELDS.forEach((field) => {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      errors[field] = `${field} is required`;
    }
  });
  if (body.price !== undefined && Number(body.price) < 0) {
    errors.price = 'price cannot be negative';
  }
  if (body.guests !== undefined && Number(body.guests) < 1) {
    errors.guests = 'guests must be at least 1';
  }
  return errors;
}

function parseAmenities(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {
      return raw.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

const MAX_IMAGES_PER_LISTING = 5;

// Uploaded files arrive in memory (see middleware/upload.js) and are stored
// as base64 data URIs directly on the document — no disk, no external
// object-storage dependency. Capped at MAX_IMAGES_PER_LISTING so repeated
// edits can't grow a document past MongoDB's 16MB limit.
function filesToDataUris(files) {
  return (files || []).map((f) => `data:${f.mimetype};base64,${f.buffer.toString('base64')}`);
}

// GET /api/accommodations?location=&guests=
async function getAll(req, res) {
  try {
    const filter = {};
    if (req.query.location) {
      filter.location = { $regex: req.query.location, $options: 'i' };
    }
    if (req.query.guests) {
      filter.guests = { $gte: Number(req.query.guests) };
    }

    const listings = await Accommodation.find(filter)
      .populate('host', 'username email createdAt')
      .sort({ createdAt: -1 });

    return res.json(listings);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch accommodations', error: err.message });
  }
}

// GET /api/accommodations/host/mine
async function getMine(req, res) {
  try {
    const listings = await Accommodation.find({ host: req.user._id }).sort({ createdAt: -1 });
    return res.json(listings);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch your listings', error: err.message });
  }
}

// GET /api/accommodations/:id
async function getOne(req, res) {
  try {
    const listing = await Accommodation.findById(req.params.id).populate('host', 'username email createdAt');
    if (!listing) return res.status(404).json({ message: 'Accommodation not found' });
    return res.json(listing);
  } catch (err) {
    return res.status(400).json({ message: 'Invalid accommodation id' });
  }
}

// POST /api/accommodations
async function create(req, res) {
  try {
    const errors = validatePayload(req.body);
    if (Object.keys(errors).length) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    const uploadedImages = filesToDataUris(req.files);
    const bodyImages = parseAmenities(req.body.images); // reuse array-parsing helper
    const images = [...bodyImages, ...uploadedImages].slice(0, MAX_IMAGES_PER_LISTING);

    const listing = await Accommodation.create({
      ...req.body,
      amenities: parseAmenities(req.body.amenities),
      images,
      host: req.user._id,
    });

    return res.status(201).json(listing);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create accommodation', error: err.message });
  }
}

// PUT /api/accommodations/:id
async function update(req, res) {
  try {
    const listing = await Accommodation.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Accommodation not found' });

    if (String(listing.host) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only edit your own listings' });
    }

    const errors = validatePayload({ ...listing.toObject(), ...req.body });
    if (Object.keys(errors).length) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    const uploadedImages = filesToDataUris(req.files);
    const keepImages = parseAmenities(req.body.images);
    const nextImages = [...keepImages, ...uploadedImages].slice(0, MAX_IMAGES_PER_LISTING);

    Object.assign(listing, req.body, {
      amenities: parseAmenities(req.body.amenities),
      images: nextImages.length ? nextImages : listing.images,
    });

    await listing.save();
    return res.json(listing);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update accommodation', error: err.message });
  }
}

// DELETE /api/accommodations/:id
async function remove(req, res) {
  try {
    const listing = await Accommodation.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Accommodation not found' });

    if (String(listing.host) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only delete your own listings' });
    }

    await listing.deleteOne();
    await Reservation.deleteMany({ accommodation: listing._id });

    return res.json({ message: 'Accommodation deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete accommodation', error: err.message });
  }
}

module.exports = { getAll, getMine, getOne, create, update, remove };
