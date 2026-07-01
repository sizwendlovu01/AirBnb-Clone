require('dotenv').config();

// Vercel's Node.js runtime treats a file under /api that exports a request
// handler as a serverless function. An Express app instance is itself a
// valid (req, res) => void handler, so exporting it directly here — with no
// app.listen() — is all that's needed. vercel.json rewrites every request
// to this function.
module.exports = require('../app');
