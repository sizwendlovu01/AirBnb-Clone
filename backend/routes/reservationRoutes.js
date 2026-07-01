const express = require('express');
const {
  create,
  getByHost,
  getByUser,
  remove,
} = require('../controllers/reservationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, create);
router.get('/host', protect, getByHost);
router.get('/user', protect, getByUser);
router.delete('/:id', protect, remove);

module.exports = router;
