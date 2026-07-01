const express = require('express');
const cors = require('cors');
const multer = require('multer');
const connectDB = require('./config/db');

const userRoutes = require('./routes/userRoutes');
const accommodationRoutes = require('./routes/accommodationRoutes');
const reservationRoutes = require('./routes/reservationRoutes');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Every request ensures a MongoDB connection first. connectDB() caches the
// connection (see config/db.js), so on a warm serverless invocation this is
// a no-op — but on a traditional long-running server it also just resolves
// immediately after the first call, so the same app works either way.
app.use((req, res, next) => {
  connectDB()
    .then(() => next())
    .catch((err) => {
      console.error('[app] database connection failed:', err.message);
      res.status(503).json({ message: 'Database unavailable, try again shortly' });
    });
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

app.use('/api/users', userRoutes);
app.use('/api/accommodations', accommodationRoutes);
app.use('/api/reservations', reservationRoutes);

// 404 handler
app.use('/api', (req, res) => res.status(404).json({ message: 'Route not found' }));

// Central error handler. Multer errors (too many files, file too large, bad
// mimetype) are client mistakes, not server failures — map them to 400
// rather than falling through to a generic 500.
app.use((err, req, res, next) => {
  console.error(err);
  if (err instanceof multer.MulterError || /^Only image files/.test(err.message || '')) {
    return res.status(400).json({ message: err.message });
  }
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

module.exports = app;
