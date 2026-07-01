const mongoose = require('mongoose');

const specificRatingsSchema = new mongoose.Schema(
  {
    cleanliness: { type: Number, default: 5, min: 0, max: 5 },
    communication: { type: Number, default: 5, min: 0, max: 5 },
    checkIn: { type: Number, default: 5, min: 0, max: 5 },
    accuracy: { type: Number, default: 5, min: 0, max: 5 },
    location: { type: Number, default: 5, min: 0, max: 5 },
    value: { type: Number, default: 5, min: 0, max: 5 },
  },
  { _id: false }
);

const accommodationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    bedrooms: { type: Number, required: true, min: 0 },
    bathrooms: { type: Number, required: true, min: 0 },
    guests: { type: Number, required: true, min: 1 },
    type: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    amenities: { type: [String], default: [] },
    images: { type: [String], default: [] },
    weeklyDiscount: { type: Number, default: 0, min: 0, max: 100 },
    cleaningFee: { type: Number, default: 0, min: 0 },
    serviceFee: { type: Number, default: 0, min: 0 },
    occupancyTaxes: { type: Number, default: 0, min: 0 },
    enhancedCleaning: { type: Boolean, default: false },
    selfCheckIn: { type: Boolean, default: false },
    rating: { type: Number, default: 4.5, min: 0, max: 5 },
    reviews: { type: Number, default: 0, min: 0 },
    specificRatings: { type: specificRatingsSchema, default: () => ({}) },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

accommodationSchema.index({ location: 1 });

module.exports = mongoose.model('Accommodation', accommodationSchema);
