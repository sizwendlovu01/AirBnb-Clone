const express = require('express');
const {
  getAll,
  getMine,
  getOne,
  create,
  update,
  remove,
} = require('../controllers/accommodationController');
const { protect, requireHost } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Order matters: /host/mine must be registered before the /:id catch-all
router.get('/', getAll);
router.get('/host/mine', protect, requireHost, getMine);
router.get('/:id', getOne);
router.post('/', protect, requireHost, upload.array('images', 5), create);
router.put('/:id', protect, requireHost, upload.array('images', 5), update);
router.delete('/:id', protect, requireHost, remove);

module.exports = router;
