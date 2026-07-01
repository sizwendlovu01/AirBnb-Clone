const mongoose = require('mongoose');

// Cached across invocations: on a traditional server this just means we
// never reconnect, but on serverless (Vercel) it's essential — a warm
// function instance reuses the same connection instead of opening a new one
// on every request, which would otherwise exhaust MongoDB Atlas's
// connection limit within minutes under real traffic.
let connectionPromise = null;

function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose.connection);
  }

  if (!connectionPromise) {
    mongoose.connection.on('connected', () => {
      console.log(`[mongo] connected -> ${mongoose.connection.name}`);
    });
    mongoose.connection.on('error', (err) => {
      console.error('[mongo] connection error:', err.message);
      connectionPromise = null;
    });

    // Pinned explicitly so a MONGO_URI without a path segment (e.g.
    // ".../?appName=...") can't silently fall back to MongoDB's default
    // "test" database instead of this app's actual database.
    connectionPromise = mongoose
      .connect(process.env.MONGO_URI, { dbName: 'airbnb-clone' })
      .then(() => mongoose.connection);
  }

  return connectionPromise;
}

module.exports = connectDB;
