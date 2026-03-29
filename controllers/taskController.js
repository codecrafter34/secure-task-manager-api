const Task = require('../models/Task');
const { asyncHandler } = require('../utils/errorHandler');

/**
 * @desc    Get all tasks
 * @route   GET /api/tasks
 * @access  Private
 * @note    Users see only their tasks, Admins see all tasks
 */
const getTasks = asyncHandler(async (req, res) => {
  // Pagination parameters
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // Build query filter
  let filter = {};

  // Non-admin users can only see their own tasks
  if (req.user.role !== 'admin') {
    filter.owner = req.user._id;
  }

  // Optional status filter
  if (req.query.status) {
    filter.status = req.query.status;
  }

  // Optional priority filter
  if (req.query.priority) {
    filter.priority = req.query.priority;
  }

  // Execute query with pagination
  const tasks = await Task.find(filter)
    .populate('owner', 'name email')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  // Get total count for pagination
  const total = await Task.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

/**
 * @desc    Get single task by ID
 * @route   GET /api/tasks/:id
 * @access  Private (owner or admin)
 */
const getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id).populate('owner', 'name email');

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }

  // Check if user is owner or admin
  if (req.user.role !== 'admin' && task.owner._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied - You can only view your own tasks'
    });
  }

  res.status(200).json({
    success: true,
    data: { task }
  });
});

/**
 * @desc    Create new task
 * @route   POST /api/tasks
 * @access  Private
 */
const createTask = asyncHandler(async (req, res) => {
  const { title, description, status, priority, dueDate } = req.body;

  // Create task with current user as owner
  const task = await Task.create({
    title,
    description,
    status,
    priority,
    dueDate,
    owner: req.user._id
  });

  // Populate owner details for response
  await task.populate('owner', 'name email');

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: { task }
  });
});

/**
 * @desc    Update task
 * @route   PUT /api/tasks/:id
 * @access  Private (owner only)
 */
const updateTask = asyncHandler(async (req, res) => {
  let task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }

  // Check if user is the owner (admin cannot update, only delete)
  if (task.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied - Only the task owner can update this task'
    });
  }

  // Update allowed fields
  const allowedUpdates = ['title', 'description', 'status', 'priority', 'dueDate'];
  const updates = {};
  
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  // Update task
  task = await Task.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  ).populate('owner', 'name email');

  res.status(200).json({
    success: true,
    message: 'Task updated successfully',
    data: { task }
  });
});

/**
 * @desc    Delete task
 * @route   DELETE /api/tasks/:id
 * @access  Private (admin only)
 */
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }

  // Only admin can delete tasks (enforced by route middleware)
  await Task.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Task deleted successfully'
  });
});

/**
 * @desc    Get task statistics
 * @route   GET /api/tasks/stats
 * @access  Private
 */
const getTaskStats = asyncHandler(async (req, res) => {
  // Build match filter based on user role
  const matchFilter = req.user.role === 'admin' ? {} : { owner: req.user._id };

  const stats = await Task.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Format stats
  const formattedStats = {
    pending: 0,
    'in-progress': 0,
    completed: 0,
    total: 0
  };

  stats.forEach(stat => {
    formattedStats[stat._id] = stat.count;
    formattedStats.total += stat.count;
  });

  res.status(200).json({
    success: true,
    data: { stats: formattedStats }
  });
});

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats
};
