const multer = require('multer');

// Memory storage (not disk) is required here: serverless platforms like
// Vercel run functions in an ephemeral, largely read-only filesystem, so
// anything written to disk mid-request is gone by the next invocation and
// never reaches other instances. Uploaded files are converted to base64 data
// URIs and stored directly on the Accommodation document instead (see
// accommodationController.js) — no disk, no separate object-storage service
// to configure, works identically in dev and in production.
//
// Limits are deliberately small: MongoDB caps a single document at 16MB, and
// base64 encoding inflates each file by ~33%. Combined with the
// MAX_IMAGES_PER_LISTING cap in accommodationController.js (5 images), worst
// case is 5 x 1.5MB x 1.37 ~= 10.3MB — safely under that ceiling even after
// repeated edits.
const storage = multer.memoryStorage();

const imageFileFilter = (req, file, cb) => {
  if (/^image\/(jpe?g|png|webp|gif)$/.test(file.mimetype)) {
    return cb(null, true);
  }
  cb(new Error('Only image files (jpg, png, webp, gif) are allowed'));
};

const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 1.5 * 1024 * 1024, files: 5 },
});

module.exports = upload;
