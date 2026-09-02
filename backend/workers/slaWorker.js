/**
 * SLA Worker
 * Runs on a schedule to:
 * 1. Mark tickets as SLA-breached if deadline has passed
 * 2. Auto-escalate breached tickets after a threshold
 * 3. Move tickets to "escalations" department if escalated twice
 */
const cron = require('node-cron');
const Ticket = require('../models/Ticket');

// Run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  try {
    const now = new Date();

    // 1. Find open/in_progress tickets past their SLA deadline that haven't been marked yet
    const breached = await Ticket.find({
      status: { $in: ['open', 'in_progress', 'pending_client'] },
      slaDeadline: { $lt: now },
      slaBreached: false,
    });

    for (const ticket of breached) {
      ticket.slaBreached = true;
      // Add critical urgency if not already
      if (ticket.urgency !== 'critical') {
        ticket.urgency = ticket.urgency === 'high' ? 'critical' : 'high';
      }
      await ticket.save();
      console.log(`[SLA Worker] SLA breached: ${ticket.ticketNumber}`);
    }

    // 2. Auto-escalate: tickets that have been breached but not yet escalated,
    //    and are more than 1 hour past their deadline
    const escalateThreshold = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
    const toEscalate = await Ticket.find({
      status: { $in: ['open', 'in_progress'] },
      slaBreached: true,
      escalated: false,
      slaDeadline: { $lt: escalateThreshold },
    });

    for (const ticket of toEscalate) {
      ticket.escalated = true;
      ticket.escalationCount += 1;
      ticket.department = 'escalations';
      ticket.urgency = 'critical';
      if (!ticket.tags.includes('escalated')) ticket.tags.push('escalated');

      // Add system comment
      ticket.comments.push({
        author: ticket.client,
        authorName: 'System',
        authorRole: 'system',
        message: `⚠️ Ticket auto-escalated due to SLA breach. Moved to Escalations department.`,
        isInternal: true,
      });

      await ticket.save();
      console.log(`[SLA Worker] Auto-escalated: ${ticket.ticketNumber}`);
    }

    if (breached.length || toEscalate.length) {
      console.log(
        `[SLA Worker] Processed ${breached.length} breaches, ${toEscalate.length} escalations at ${now.toISOString()}`
      );
    }
  } catch (err) {
    console.error('[SLA Worker] Error:', err);
  }
});

console.log('[SLA Worker] Started — checking every 5 minutes');
