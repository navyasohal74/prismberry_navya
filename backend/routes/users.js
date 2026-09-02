const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');

// @route   GET /api/users/agents
// @desc    Get all agents (for assignment dropdowns)
// @access  Private (agent only)
router.get('/agents', protect, authorize('agent'), async (req, res) => {
  try {
    const agents = await User.find({ role: 'agent', isActive: true }).select(
      'name email department activeTicketCount'
    );
    res.json({ success: true, agents });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/users/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// @route   PUT /api/users/me
// @desc    Update current user profile
// @access  Private
router.put('/me', protect, async (req, res) => {
  try {
    const { name, department } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (department && req.user.role === 'agent') updates.department = department;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
