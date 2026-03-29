const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');
const {
  createTaskValidation,
  updateTaskValidation,
  taskIdValidation,
  paginationValidation
} = require('../utils/validators');

/**
 * Task Routes
 * All routes require authentication
 * Delete requires admin role
 */

// Apply protect middleware to all routes
router.use(protect);

// @route   GET /api/tasks/stats
// @desc    Get task statistics
// @access  Private
router.get('/stats', getTaskStats);

// @route   GET /api/tasks
// @desc    Get all tasks (filtered by role)
// @access  Private
router.get('/', paginationValidation, getTasks);

// @route   POST /api/tasks
// @desc    Create new task
// @access  Private
router.post('/', createTaskValidation, createTask);

// @route   GET /api/tasks/:id
// @desc    Get task by ID
// @access  Private (owner or admin)
router.get('/:id', taskIdValidation, getTaskById);

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private (owner only)
router.put('/:id', updateTaskValidation, updateTask);

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private (admin only)
router.delete('/:id', taskIdValidation, adminOnly, deleteTask);

module.exports = router;
