const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

// all task routes need authentication
router.use(protect);

// GET /api/tasks/dashboard/stats - dashboard overview
// NOTE: this route must be defined before /:id to avoid conflict
router.get('/dashboard/stats', async (req, res) => {
  try {
    // find all projects user belongs to
    const userProjects = await Project.find({
      $or: [
        { owner: req.user._id },
        { members: req.user._id }
      ]
    }).select('_id');

    const projectIds = userProjects.map(p => p._id);
    const allTasks = await Task.find({ project: { $in: projectIds } });

    const now = new Date();
    const stats = {
      total: allTasks.length,
      todo: allTasks.filter(t => t.status === 'todo').length,
      inProgress: allTasks.filter(t => t.status === 'in-progress').length,
      done: allTasks.filter(t => t.status === 'done').length,
      overdue: allTasks.filter(t =>
        t.dueDate && new Date(t.dueDate) < now && t.status !== 'done'
      ).length,
      highPriority: allTasks.filter(t => t.priority === 'high' && t.status !== 'done').length
    };

    // grab the 5 most recent tasks for the dashboard feed
    const recentTasks = await Task.find({ project: { $in: projectIds } })
      .populate('assignedTo', 'name')
      .populate('project', 'name')
      .sort('-createdAt')
      .limit(5);

    res.json({ stats, recentTasks });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ message: 'Failed to load dashboard data' });
  }
});

// GET /api/tasks - list tasks with optional filters
router.get('/', async (req, res) => {
  try {
    // base filter: only tasks from user's projects
    const userProjects = await Project.find({
      $or: [
        { owner: req.user._id },
        { members: req.user._id }
      ]
    }).select('_id');

    const projectIds = userProjects.map(p => p._id);
    const filter = { project: { $in: projectIds } };

    // apply optional query params
    if (req.query.project) filter.project = req.query.project;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
    if (req.query.priority) filter.priority = req.query.priority;

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name')
      .sort('-createdAt');

    res.json(tasks);
  } catch (err) {
    console.error('Fetch tasks error:', err);
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
});

// POST /api/tasks - create a new task
router.post('/', [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('project').notEmpty().withMessage('Project is required'),
  body('status').optional().isIn(['todo', 'in-progress', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // make sure the project exists and user has access
    const project = await Project.findById(req.body.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const hasAccess = project.owner.toString() === req.user._id.toString() ||
      project.members.some(m => m.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({ message: 'You do not belong to this project' });
    }

    const task = await Task.create({
      title: req.body.title,
      description: req.body.description || '',
      status: req.body.status || 'todo',
      priority: req.body.priority || 'medium',
      project: req.body.project,
      assignedTo: req.body.assignedTo || null,
      createdBy: req.user._id,
      dueDate: req.body.dueDate || null
    });

    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    await task.populate('project', 'name');

    res.status(201).json(task);
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ message: 'Failed to create task' });
  }
});

// GET /api/tasks/:id - get a single task
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (err) {
    console.error('Fetch task error:', err);
    res.status(500).json({ message: 'Failed to fetch task' });
  }
});

// PUT /api/tasks/:id - update a task
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // permission check: admin, assignee, or creator can update
    const isAdmin = req.user.role === 'admin';
    const isAssignee = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();
    const isCreator = task.createdBy.toString() === req.user._id.toString();

    if (!isAdmin && !isAssignee && !isCreator) {
      return res.status(403).json({ message: 'You are not authorized to update this task' });
    }

    // only update allowed fields
    const updatableFields = ['title', 'description', 'status', 'priority', 'assignedTo', 'dueDate'];
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });

    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    await task.populate('project', 'name');

    res.json(task);
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ message: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id - delete task (admin or original creator)
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const isAdmin = req.user.role === 'admin';
    const isCreator = task.createdBy.toString() === req.user._id.toString();

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ message: 'You are not authorized to delete this task' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ message: 'Failed to delete task' });
  }
});

module.exports = router;
