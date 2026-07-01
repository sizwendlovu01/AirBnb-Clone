require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

// Traditional long-running server entry point — used for local dev and for
// hosts like Render/Railway that run a persistent Node process. Vercel's
// serverless entry point is api/index.js, which reuses the same app.js but
// never calls listen().
const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`[server] listening on port ${PORT}`));
  } catch (err) {
    console.error('[server] failed to start:', err.message);
    process.exit(1);
  }
}

start();

module.exports = app;
