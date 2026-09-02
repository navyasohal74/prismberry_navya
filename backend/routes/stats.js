const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Ticket = require('../models/Ticket');

// @route   GET /api/stats/agent
// @desc    Dashboard stats for agents
// @access  Private (agent)
router.get('/agent', protect, authorize('agent'), async (req, res) => {
  try {
    const [
      totalOpen,
      totalInProgress,
      totalResolved,
      criticalCount,
      highCount,
      slaBreached,
      escalated,
      byDept,
      myTickets,
    ] = await Promise.all([
      Ticket.countDocuments({ status: 'open' }),
      Ticket.countDocuments({ status: 'in_progress' }),
      Ticket.countDocuments({ status: { $in: ['resolved', 'closed'] } }),
      Ticket.countDocuments({ urgency: 'critical', status: { $in: ['open', 'in_progress'] } }),
      Ticket.countDocuments({ urgency: 'high', status: { $in: ['open', 'in_progress'] } }),
      Ticket.countDocuments({ slaBreached: true, status: { $in: ['open', 'in_progress'] } }),
      Ticket.countDocuments({ escalated: true, status: { $in: ['open', 'in_progress'] } }),
      Ticket.aggregate([
        { $match: { status: { $in: ['open', 'in_progress'] } } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Ticket.countDocuments({ assignedAgent: req.user._id, status: { $in: ['open', 'in_progress'] } }),
    ]);

    res.json({
      success: true,
      stats: {
        totalOpen,
        totalInProgress,
        totalResolved,
        criticalCount,
        highCount,
        slaBreached,
        escalated,
        byDepartment: byDept,
        myActiveTickets: myTickets,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/stats/client
// @desc    Stats for a client
// @access  Private (client)
router.get('/client', protect, authorize('client'), async (req, res) => {
  try {
    const [total, open, inProgress, resolved, closed] = await Promise.all([
      Ticket.countDocuments({ client: req.user._id }),
      Ticket.countDocuments({ client: req.user._id, status: 'open' }),
      Ticket.countDocuments({ client: req.user._id, status: 'in_progress' }),
      Ticket.countDocuments({ client: req.user._id, status: 'resolved' }),
      Ticket.countDocuments({ client: req.user._id, status: 'closed' }),
    ]);

    res.json({
      success: true,
      stats: { total, open, inProgress, resolved, closed },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
