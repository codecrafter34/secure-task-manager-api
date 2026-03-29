const express = require('express');
const router = express.Router();
const { getAllUsers } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

/**
 * Admin Routes
 * All routes require admin role
 */

// Apply protect and adminOnly middleware to all routes
router.use(protect, adminOnly);

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private/Admin
router.get('/users', getAllUsers);

module.exports = router;
