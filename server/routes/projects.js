const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');
const { protect, adminOnly } = require('../middleware/auth');

// all project routes require authentication
router.use(protect);

// GET /api/projects - list projects the user belongs to
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        { members: req.user._id }
      ]
    })
      .populate('owner', 'name email')
      .populate('members', 'name email')
      .sort('-createdAt');

    res.json(projects);
  } catch (err) {
    console.error('Fetch projects error:', err);
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
});

// POST /api/projects - create project (admin only)
router.post('/', adminOnly, [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('description').optional().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const project = await Project.create({
      name: req.body.name,
      description: req.body.description || '',
      owner: req.user._id,
      members: [req.user._id]
    });

    await project.populate('owner', 'name email');
    await project.populate('members', 'name email');

    res.status(201).json(project);
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ message: 'Failed to create project' });
  }
});

// GET /api/projects/:id - get single project details
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // verify access
    const hasAccess = project.owner._id.toString() === req.user._id.toString() ||
      project.members.some(m => m._id.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this project' });
    }

    res.json(project);
  } catch (err) {
    console.error('Fetch project error:', err);
    res.status(500).json({ message: 'Failed to fetch project details' });
  }
});

// PUT /api/projects/:id - update project info (admin only)
router.put('/:id', adminOnly, [
  body('name').optional().trim().notEmpty(),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (req.body.name) project.name = req.body.name;
    if (req.body.description !== undefined) project.description = req.body.description;

    await project.save();
    await project.populate('owner', 'name email');
    await project.populate('members', 'name email');

    res.json(project);
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ message: 'Failed to update project' });
  }
});

// DELETE /api/projects/:id - remove project and all tasks (admin only)
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // cascade delete all tasks belonging to this project
    await Task.deleteMany({ project: project._id });
    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: 'Project and its tasks have been deleted' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ message: 'Failed to delete project' });
  }
});

// POST /api/projects/:id/members - add a member by email (admin only)
router.post('/:id/members', adminOnly, [
  body('email').isEmail().withMessage('A valid email is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const userToAdd = await User.findOne({ email: req.body.email });
    if (!userToAdd) {
      return res.status(404).json({ message: 'No user found with that email' });
    }

    if (project.members.includes(userToAdd._id)) {
      return res.status(400).json({ message: 'This user is already a project member' });
    }

    project.members.push(userToAdd._id);
    await project.save();
    await project.populate('owner', 'name email');
    await project.populate('members', 'name email');

    res.json(project);
  } catch (err) {
    console.error('Add member error:', err);
    res.status(500).json({ message: 'Failed to add member' });
  }
});

// DELETE /api/projects/:id/members/:userId - remove member (admin only)
router.delete('/:id/members/:userId', adminOnly, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.owner.toString() === req.params.userId) {
      return res.status(400).json({ message: 'Cannot remove the project owner from members' });
    }

    project.members = project.members.filter(
      m => m.toString() !== req.params.userId
    );
    await project.save();
    await project.populate('owner', 'name email');
    await project.populate('members', 'name email');

    res.json(project);
  } catch (err) {
    console.error('Remove member error:', err);
    res.status(500).json({ message: 'Failed to remove member' });
  }
});

module.exports = router;
