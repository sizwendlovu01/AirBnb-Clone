require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');
const Accommodation = require('./models/Accommodation');
const Reservation = require('./models/Reservation');

const users = [
  { username: 'John Doe', email: 'john@example.com', password: 'password123', role: 'user' },
  { username: 'Jane Doe', email: 'jane@example.com', password: 'password321', role: 'host' },
];

// Every URL below was individually downloaded and visually verified to be an
// actual apartment/house photo (exterior, living room, kitchen, bedroom,
// bathroom, etc.) before being used here — no random/unrelated stock photos.
const img = (id) => `https://images.unsplash.com/photo-${id}?w=800&h=600&fit=crop&q=80`;
const PHOTOS = {
  poolHouseExterior: img('1512917774080-9991f1c4c750'),
  cozyStudioLiving: img('1502672260266-1c1ef2d93688'),
  euroApartmentLiving: img('1522708323590-d24dbb6b0267'),
  stagedLivingRoom: img('1560448204-603b3fc33ddc'),
  modernKitchen: img('1484154218962-a197022b5858'),
  blueSofaLiving: img('1493809842364-78817add7ffb'),
  cabinExteriorNight: img('1568605114967-8130f3a36994'),
  staircaseInterior: img('1502005229762-cf1b2da7c5d6'),
  houseWithPalms: img('1583608205776-bfd35f0d9f83'),
  resortPoolSunset: img('1571003123894-1f0594d2b5d9'),
  bedroomBluePillows: img('1522771739844-6a9f6d5f14af'),
  openLivingKitchen: img('1560185127-6ed189bf02f4'),
  frontPorch: img('1560184897-ae75f418493e'),
  bathroom: img('1584622650111-993a426fbf0a'),
  luxeBedroom: img('1512918728675-ed5a9ecdebfd'),
  loftLivingKitchen: img('1554995207-c18c203602cb'),
};

const listingTemplates = [
  {
    title: 'Modern Apartment in New York',
    location: 'New York',
    description:
      'Stay in the heart of New York City in this bright, modern apartment minutes from Central Park and the subway.',
    bedrooms: 2,
    bathrooms: 2,
    guests: 4,
    type: 'Entire apartment',
    price: 320,
    amenities: ['wifi', 'kitchen', 'free parking'],
    images: [
      PHOTOS.euroApartmentLiving,
      PHOTOS.modernKitchen,
      PHOTOS.bedroomBluePillows,
      PHOTOS.openLivingKitchen,
      PHOTOS.bathroom,
    ],
    weeklyDiscount: 10,
    cleaningFee: 50,
    serviceFee: 50,
    occupancyTaxes: 30,
    enhancedCleaning: true,
    selfCheckIn: true,
    rating: 4.5,
    reviews: 320,
  },
  {
    title: 'Cozy Studio near Venice Beach',
    location: 'Los Angeles',
    description: 'A cozy studio a five minute walk from Venice Beach with fast wifi and a private patio.',
    bedrooms: 1,
    bathrooms: 1,
    guests: 2,
    type: 'Entire studio',
    price: 180,
    amenities: ['wifi', 'air conditioning', 'washer'],
    images: [PHOTOS.cozyStudioLiving, PHOTOS.stagedLivingRoom, PHOTOS.bedroomBluePillows, PHOTOS.bathroom],
    weeklyDiscount: 5,
    cleaningFee: 35,
    serviceFee: 30,
    occupancyTaxes: 18,
    enhancedCleaning: false,
    selfCheckIn: true,
    rating: 4.7,
    reviews: 142,
  },
  {
    title: 'Lakefront Cabin Retreat',
    location: 'Lake Tahoe',
    description: 'Unplug in this quiet lakefront cabin with a private dock, fireplace, and mountain views.',
    bedrooms: 3,
    bathrooms: 2,
    guests: 6,
    type: 'Entire cabin',
    price: 260,
    amenities: ['wifi', 'kitchen', 'fireplace', 'lake access'],
    images: [
      PHOTOS.cabinExteriorNight,
      PHOTOS.frontPorch,
      PHOTOS.blueSofaLiving,
      PHOTOS.bedroomBluePillows,
      PHOTOS.bathroom,
    ],
    weeklyDiscount: 15,
    cleaningFee: 60,
    serviceFee: 45,
    occupancyTaxes: 25,
    enhancedCleaning: true,
    selfCheckIn: false,
    rating: 4.9,
    reviews: 87,
  },
  {
    title: 'Oceanfront Condo on South Beach',
    location: 'Miami',
    description: 'Floor-to-ceiling windows overlooking the Atlantic, steps from South Beach and Ocean Drive nightlife.',
    bedrooms: 2,
    bathrooms: 2,
    guests: 4,
    type: 'Entire apartment',
    price: 280,
    amenities: ['wifi', 'pool', 'gym', 'air conditioning'],
    images: [
      PHOTOS.houseWithPalms,
      PHOTOS.resortPoolSunset,
      PHOTOS.luxeBedroom,
      PHOTOS.bathroom,
      PHOTOS.openLivingKitchen,
    ],
    weeklyDiscount: 8,
    cleaningFee: 55,
    serviceFee: 40,
    occupancyTaxes: 28,
    enhancedCleaning: true,
    selfCheckIn: true,
    rating: 4.6,
    reviews: 201,
  },
  {
    title: 'Chic Loft in Le Marais',
    location: 'Paris',
    description: 'A sun-filled loft on a quiet cobblestone street in Le Marais, walking distance to the Louvre and Seine.',
    bedrooms: 1,
    bathrooms: 1,
    guests: 3,
    type: 'Entire apartment',
    price: 210,
    amenities: ['wifi', 'kitchen', 'washer'],
    images: [
      PHOTOS.euroApartmentLiving,
      PHOTOS.loftLivingKitchen,
      PHOTOS.bedroomBluePillows,
      PHOTOS.modernKitchen,
    ],
    weeklyDiscount: 12,
    cleaningFee: 45,
    serviceFee: 35,
    occupancyTaxes: 20,
    enhancedCleaning: false,
    selfCheckIn: true,
    rating: 4.8,
    reviews: 256,
  },
  {
    title: 'Beachfront Villa with Private Pool',
    location: 'Cancun',
    description: 'A palm-shaded villa with a private pool and direct beach access in the heart of the hotel zone.',
    bedrooms: 4,
    bathrooms: 3,
    guests: 8,
    type: 'Entire house',
    price: 410,
    amenities: ['wifi', 'pool', 'kitchen', 'beach access', 'free parking'],
    images: [
      PHOTOS.resortPoolSunset,
      PHOTOS.poolHouseExterior,
      PHOTOS.luxeBedroom,
      PHOTOS.openLivingKitchen,
      PHOTOS.bathroom,
    ],
    weeklyDiscount: 18,
    cleaningFee: 80,
    serviceFee: 60,
    occupancyTaxes: 40,
    enhancedCleaning: true,
    selfCheckIn: false,
    rating: 4.9,
    reviews: 94,
  },
  {
    title: 'Cozy Brownstone in Brooklyn',
    location: 'New York',
    description: 'A charming garden-level brownstone unit in Park Slope, close to the subway and local cafes.',
    bedrooms: 1,
    bathrooms: 1,
    guests: 2,
    type: 'Private room',
    price: 140,
    amenities: ['wifi', 'kitchen'],
    images: [PHOTOS.stagedLivingRoom, PHOTOS.bedroomBluePillows, PHOTOS.staircaseInterior],
    weeklyDiscount: 5,
    cleaningFee: 30,
    serviceFee: 25,
    occupancyTaxes: 15,
    enhancedCleaning: false,
    selfCheckIn: true,
    rating: 4.4,
    reviews: 63,
  },
  {
    title: 'Downtown Austin Music Loft',
    location: 'Austin',
    description: 'An industrial-chic loft two blocks from Rainey Street, ideal for a live-music weekend getaway.',
    bedrooms: 2,
    bathrooms: 1,
    guests: 4,
    type: 'Entire apartment',
    price: 195,
    amenities: ['wifi', 'kitchen', 'free parking'],
    images: [PHOTOS.loftLivingKitchen, PHOTOS.openLivingKitchen, PHOTOS.modernKitchen, PHOTOS.bedroomBluePillows],
    weeklyDiscount: 10,
    cleaningFee: 40,
    serviceFee: 30,
    occupancyTaxes: 18,
    enhancedCleaning: false,
    selfCheckIn: true,
    rating: 4.5,
    reviews: 112,
  },
  {
    title: 'Modern Houseboat on Lake Union',
    location: 'Seattle',
    description: 'Wake up to water views in this modern floating home, minutes from Fremont and downtown Seattle.',
    bedrooms: 2,
    bathrooms: 1,
    guests: 4,
    type: 'Entire house',
    price: 250,
    amenities: ['wifi', 'kitchen', 'lake access'],
    images: [PHOTOS.blueSofaLiving, PHOTOS.stagedLivingRoom, PHOTOS.bedroomBluePillows, PHOTOS.bathroom],
    weeklyDiscount: 10,
    cleaningFee: 50,
    serviceFee: 35,
    occupancyTaxes: 22,
    enhancedCleaning: true,
    selfCheckIn: true,
    rating: 4.7,
    reviews: 78,
  },
];

async function seed() {
  await connectDB();

  await Promise.all([User.deleteMany({}), Accommodation.deleteMany({}), Reservation.deleteMany({})]);

  const createdUsers = [];
  for (const u of users) {
    createdUsers.push(await User.create(u));
  }
  const host = createdUsers.find((u) => u.role === 'host');

  for (const listing of listingTemplates) {
    await Accommodation.create({ ...listing, host: host._id });
  }

  console.log('Seed complete:');
  console.log(`  Users: ${createdUsers.map((u) => `${u.email} (${u.role})`).join(', ')}`);
  console.log(`  Listings created: ${listingTemplates.length}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
