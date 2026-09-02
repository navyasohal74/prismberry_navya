const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../config/multer');
const Ticket = require('../models/Ticket');
const { triageTicket } = require('../services/triageService');
const { assignAgent, releaseAgent } = require('../services/routingService');

// ─── CREATE TICKET ────────────────────────────────────────────────────────────
// @route   POST /api/tickets
// @desc    Client submits a new ticket
// @access  Private (client | agent)
router.post('/', protect, upload.array('attachments', 5), async (req, res) => {
  try {
    const { subject, description } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ success: false, message: 'Subject and description are required' });
    }

    // Triage
    const triage = triageTicket(subject, description);

    // Route to agent
    const agent = await assignAgent(triage.department);

    // Build attachments array
    const attachments = (req.files || []).map((f) => ({
      filename: f.filename,
      originalName: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
      path: `/uploads/${f.filename}`,
    }));

    const ticket = await Ticket.create({
      subject,
      description,
      client: req.user._id,
      clientName: req.user.name,
      clientEmail: req.user.email,
      assignedAgent: agent ? agent._id : null,
      agentName: agent ? agent.name : null,
      urgency: triage.urgency,
      department: triage.department,
      tags: triage.tags,
      category: triage.category,
      slaDeadline: triage.slaDeadline,
      priorityScore: triage.priorityScore,
      attachments,
    });

    // Populate for response
    const populated = await Ticket.findById(ticket._id)
      .populate('client', 'name email')
      .populate('assignedAgent', 'name email department');

    res.status(201).json({
      success: true,
      message: `Ticket ${ticket.ticketNumber} submitted. ${
        agent ? `Assigned to ${agent.name}.` : 'An agent will be assigned shortly.'
      } SLA deadline: ${triage.slaDeadline.toISOString()}.`,
      ticket: populated,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

// ─── GET ALL TICKETS (agent view) ─────────────────────────────────────────────
// @route   GET /api/tickets
// @desc    Agent gets all tickets with filters; client gets only their own
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { urgency, department, status, assignedAgent, page = 1, limit = 20, sort = '-createdAt' } = req.query;

    const filter = {};

    // Clients only see their own tickets
    if (req.user.role === 'client') {
      filter.client = req.user._id;
    } else {
      // Agents: optional filters
      if (urgency) filter.urgency = urgency;
      if (department) filter.department = department;
      if (assignedAgent) filter.assignedAgent = assignedAgent === 'me' ? req.user._id : assignedAgent;
    }

    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .populate('client', 'name email')
        .populate('assignedAgent', 'name email department')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Ticket.countDocuments(filter),
    ]);

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      tickets,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── GET SINGLE TICKET ────────────────────────────────────────────────────────
// @route   GET /api/tickets/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('client', 'name email')
      .populate('assignedAgent', 'name email department')
      .populate('comments.author', 'name role');

    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    // Clients can only view their own tickets
    if (req.user.role === 'client' && ticket.client._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── UPDATE TICKET ────────────────────────────────────────────────────────────
// @route   PUT /api/tickets/:id
// @desc    Agent updates status, urgency, assignment; client can add reply
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    const { status, urgency, department, assignedAgent, comment, isInternal } = req.body;

    const wasResolved =
      ticket.status !== 'resolved' &&
      ticket.status !== 'closed' &&
      (status === 'resolved' || status === 'closed');

    // Agents can update everything; clients can only comment
    if (req.user.role === 'agent') {
      if (status) ticket.status = status;
      if (urgency) ticket.urgency = urgency;
      if (department) ticket.department = department;
      if (assignedAgent !== undefined) {
        // Release old agent
        if (ticket.assignedAgent) await releaseAgent(ticket.assignedAgent);
        ticket.assignedAgent = assignedAgent || null;
      }

      // Track first response
      if (!ticket.firstResponseAt && comment) {
        ticket.firstResponseAt = new Date();
        ticket.responseTimeMinutes = Math.round(
          (new Date() - ticket.createdAt) / (1000 * 60)
        );
      }

      // Track resolution time
      if (wasResolved) {
        ticket.resolvedAt = new Date();
        ticket.resolutionTimeMinutes = Math.round(
          (new Date() - ticket.createdAt) / (1000 * 60)
        );
        if (ticket.assignedAgent) await releaseAgent(ticket.assignedAgent);
      }
    } else {
      // Client can only add a comment
      if (status || urgency || department || assignedAgent !== undefined) {
        return res.status(403).json({ success: false, message: 'Clients can only add comments' });
      }
    }

    // Add comment (both roles)
    if (comment) {
      ticket.comments.push({
        author: req.user._id,
        authorName: req.user.name,
        authorRole: req.user.role,
        message: comment,
        isInternal: req.user.role === 'agent' && isInternal === true,
      });
    }

    await ticket.save();

    const updated = await Ticket.findById(ticket._id)
      .populate('client', 'name email')
      .populate('assignedAgent', 'name email department');

    res.json({ success: true, ticket: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── DELETE TICKET ────────────────────────────────────────────────────────────
// @route   DELETE /api/tickets/:id
// @access  Private (agent only)
router.delete('/:id', protect, authorize('agent'), async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    if (ticket.assignedAgent) await releaseAgent(ticket.assignedAgent);
    res.json({ success: true, message: 'Ticket deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── ADD COMMENT ─────────────────────────────────────────────────────────────
// @route   POST /api/tickets/:id/comments
// @access  Private
router.post('/:id/comments', protect, async (req, res) => {
  try {
    const { message, isInternal } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    // Clients can only comment on their own tickets
    if (req.user.role === 'client' && ticket.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    ticket.comments.push({
      author: req.user._id,
      authorName: req.user.name,
      authorRole: req.user.role,
      message,
      isInternal: req.user.role === 'agent' && isInternal === true,
    });

    // Track first response by agent
    if (req.user.role === 'agent' && !ticket.firstResponseAt) {
      ticket.firstResponseAt = new Date();
      ticket.responseTimeMinutes = Math.round((new Date() - ticket.createdAt) / (1000 * 60));
    }

    await ticket.save();
    res.json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
