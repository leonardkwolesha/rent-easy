const router = require('express').Router();
const { protect } = require('../middleware/auth');
const {
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
} = require('../controllers/restaurantController');

// GET /api/restaurants?cuisine=pizza&area=Kariakoo&isOpen=true&sort=rating
router.get('/', getRestaurants);

// GET /api/restaurants/:id
router.get('/:id', getRestaurantById);

// POST /api/restaurants (protected)
router.post('/', protect, createRestaurant);

// PUT /api/restaurants/:id (protected)
router.put('/:id', protect, updateRestaurant);

module.exports = router;
