const Reservation = require('../models/Reservation');
const Accommodation = require('../models/Accommodation');

const MS_PER_NIGHT = 24 * 60 * 60 * 1000;

function computePriceBreakdown(listing, nights) {
  const nightlyRate = listing.price;
  const subtotal = nightlyRate * nights;
  const weeklyDiscountAmount =
    nights >= 7 ? Math.round(subtotal * (listing.weeklyDiscount / 100)) : 0;
  const total =
    subtotal -
    weeklyDiscountAmount +
    listing.cleaningFee +
    listing.serviceFee +
    listing.occupancyTaxes;

  return {
    nightlyRate,
    subtotal,
    weeklyDiscountAmount,
    cleaningFee: listing.cleaningFee,
    serviceFee: listing.serviceFee,
    occupancyTaxes: listing.occupancyTaxes,
    total,
  };
}

// POST /api/reservations
async function create(req, res) {
  try {
    const { accommodationId, checkIn, checkOut, guests } = req.body;

    if (!accommodationId || !checkIn || !checkOut || !guests) {
      return res.status(400).json({
        message: 'accommodationId, checkIn, checkOut and guests are required',
      });
    }

    const listing = await Accommodation.findById(accommodationId);
    if (!listing) return res.status(404).json({ message: 'Accommodation not found' });

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
      return res.status(400).json({ message: 'Invalid checkIn or checkOut date' });
    }
    if (checkOutDate <= checkInDate) {
      return res.status(400).json({ message: 'checkOut must be after checkIn' });
    }
    if (Number(guests) > listing.guests) {
      return res.status(400).json({
        message: `This listing allows a maximum of ${listing.guests} guests`,
      });
    }

    const nights = Math.round((checkOutDate - checkInDate) / MS_PER_NIGHT);
    const priceBreakdown = computePriceBreakdown(listing, nights);

    const reservation = await Reservation.create({
      accommodation: listing._id,
      user: req.user._id,
      host: listing.host,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests,
      nights,
      priceBreakdown,
    });

    return res.status(201).json(reservation);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create reservation', error: err.message });
  }
}

// GET /api/reservations/host
async function getByHost(req, res) {
  try {
    const reservations = await Reservation.find({ host: req.user._id })
      .populate('accommodation', 'title location images price')
      .populate('user', 'username email')
      .sort({ createdAt: -1 });
    return res.json(reservations);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch host reservations', error: err.message });
  }
}

// GET /api/reservations/user
async function getByUser(req, res) {
  try {
    const reservations = await Reservation.find({ user: req.user._id })
      .populate('accommodation', 'title location images price')
      .sort({ createdAt: -1 });
    return res.json(reservations);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch your reservations', error: err.message });
  }
}

// DELETE /api/reservations/:id
async function remove(req, res) {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

    const isOwner = String(reservation.user) === String(req.user._id);
    const isHost = String(reservation.host) === String(req.user._id);
    if (!isOwner && !isHost) {
      return res.status(403).json({ message: 'You cannot cancel this reservation' });
    }

    await reservation.deleteOne();
    return res.json({ message: 'Reservation cancelled' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to cancel reservation', error: err.message });
  }
}

module.exports = { create, getByHost, getByUser, remove };
