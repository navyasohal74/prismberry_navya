/**
 * Routing Service
 * Assigns incoming tickets to the least-busy agent
 * in the appropriate department (round-robin by load).
 */
const User = require('../models/User');

/**
 * Find the best agent to assign a ticket to.
 * Priority: agents in the matching department with fewest active tickets.
 * Falls back to any active agent if no dept match.
 */
async function assignAgent(department) {
  try {
    // Try to find agent in the matching department
    let agents = await User.find({
      role: 'agent',
      isActive: true,
      department,
    }).sort({ activeTicketCount: 1 });

    // Fallback: any available agent
    if (!agents.length) {
      agents = await User.find({
        role: 'agent',
        isActive: true,
      }).sort({ activeTicketCount: 1 });
    }

    if (!agents.length) return null;

    // Pick the agent with the lowest ticket count
    const chosen = agents[0];

    // Increment their counter
    await User.findByIdAndUpdate(chosen._id, { $inc: { activeTicketCount: 1 } });

    return chosen;
  } catch (err) {
    console.error('Routing error:', err);
    return null;
  }
}

/**
 * Decrement agent's active ticket count when a ticket is resolved/closed.
 */
async function releaseAgent(agentId) {
  if (!agentId) return;
  await User.findByIdAndUpdate(agentId, {
    $inc: { activeTicketCount: -1 },
  });
}

module.exports = { assignAgent, releaseAgent };
