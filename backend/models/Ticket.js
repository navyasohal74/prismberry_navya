const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorName: String,
    authorRole: String,
    message: {
      type: String,
      required: true,
    },
    isInternal: {
      type: Boolean,
      default: false, // internal notes only visible to agents
    },
  },
  { timestamps: true }
);

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      unique: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    // Who submitted
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    clientName: String,
    clientEmail: String,

    // Assigned agent
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    agentName: String,

    // Triage results
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    department: {
      type: String,
      enum: ['billing', 'technical', 'general', 'sales', 'escalations'],
      default: 'general',
    },
    tags: [String],
    category: {
      type: String,
      default: 'general',
    },

    // Status lifecycle
    status: {
      type: String,
      enum: ['open', 'in_progress', 'pending_client', 'resolved', 'closed'],
      default: 'open',
    },

    // Attachments
    attachments: [
      {
        filename: String,
        originalName: String,
        mimetype: String,
        size: Number,
        path: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // SLA
    slaDeadline: {
      type: Date,
    },
    slaBreached: {
      type: Boolean,
      default: false,
    },
    escalated: {
      type: Boolean,
      default: false,
    },
    escalationCount: {
      type: Number,
      default: 0,
    },

    // Timestamps for lifecycle
    firstResponseAt: Date,
    resolvedAt: Date,
    closedAt: Date,

    // Response time in minutes
    responseTimeMinutes: Number,
    resolutionTimeMinutes: Number,

    comments: [commentSchema],

    // Priority score for sorting (computed)
    priorityScore: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Auto-generate ticket number before save
ticketSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await mongoose.model('Ticket').countDocuments();
    this.ticketNumber = `TKT-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Indexes for dashboard queries
ticketSchema.index({ client: 1, status: 1 });
ticketSchema.index({ assignedAgent: 1, status: 1 });
ticketSchema.index({ urgency: 1, department: 1 });
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ slaDeadline: 1, status: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);
