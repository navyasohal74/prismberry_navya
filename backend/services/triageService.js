/**
 * Triage Service
 * Automatically classifies ticket urgency, department, tags,
 * and computes SLA deadline from subject + description keywords.
 */

// Keyword maps for department detection
const DEPARTMENT_KEYWORDS = {
  billing: [
    'invoice', 'payment', 'charge', 'refund', 'billing', 'subscription',
    'price', 'cost', 'fee', 'transaction', 'receipt', 'overcharge', 'plan',
    'upgrade', 'downgrade', 'cancel', 'cancellation', 'credit', 'debit',
  ],
  technical: [
    'bug', 'error', 'crash', 'not working', 'broken', 'fix', 'issue',
    'problem', 'fail', 'failure', 'down', 'outage', 'timeout', 'slow',
    'performance', 'login', 'password', 'reset', 'api', 'integration',
    'install', 'setup', 'configure', 'update', 'upgrade', 'database',
    'server', '500', '404', 'exception', 'stack trace', 'debug',
  ],
  sales: [
    'purchase', 'buy', 'order', 'demo', 'trial', 'pricing', 'quote',
    'discount', 'promo', 'offer', 'enterprise', 'license', 'seats',
    'onboard', 'onboarding', 'contract', 'renewal', 'interested',
  ],
  escalations: [
    'urgent', 'critical', 'emergency', 'escalate', 'manager', 'supervisor',
    'legal', 'lawsuit', 'complaint', 'unacceptable', 'furious', 'angry',
    'threatening', 'immediate', 'asap', 'immediately', 'right now',
  ],
};

// Keyword maps for urgency detection
const URGENCY_KEYWORDS = {
  critical: [
    'critical', 'emergency', 'system down', 'outage', 'data loss',
    'security breach', 'hacked', 'production down', 'complete failure',
    'immediately', 'asap', 'urgent critical', 'business critical',
    'revenue loss', 'legal', 'lawsuit', 'threatening',
  ],
  high: [
    'urgent', 'high priority', 'asap', 'important', 'serious',
    'blocking', 'blocked', 'cannot access', 'unable to login',
    'service unavailable', 'major bug', 'data incorrect', 'wrong charge',
    'angry', 'furious', 'complaint', 'manager', 'frustrated',
  ],
  low: [
    'question', 'how to', 'inquiry', 'wondering', 'curious', 'suggestion',
    'feedback', 'feature request', 'when will', 'nice to have',
    'documentation', 'tutorial', 'guide', 'help understanding',
  ],
};

// SLA deadlines by urgency (in hours)
const SLA_HOURS = {
  critical: 2,
  high: 8,
  medium: 24,
  low: 72,
};

/**
 * Score text against a keyword list
 */
function scoreText(text, keywords) {
  const lower = text.toLowerCase();
  let score = 0;
  const matchedKeywords = [];

  for (const keyword of keywords) {
    if (lower.includes(keyword)) {
      score += keyword.split(' ').length; // multi-word phrases score higher
      matchedKeywords.push(keyword);
    }
  }
  return { score, matchedKeywords };
}

/**
 * Determine department from text
 */
function detectDepartment(text) {
  let bestDept = 'general';
  let bestScore = 0;

  for (const [dept, keywords] of Object.entries(DEPARTMENT_KEYWORDS)) {
    const { score } = scoreText(text, keywords);
    if (score > bestScore) {
      bestScore = score;
      bestDept = dept;
    }
  }

  return bestDept;
}

/**
 * Determine urgency from text
 */
function detectUrgency(text) {
  // Check critical first (highest priority)
  const criticalResult = scoreText(text, URGENCY_KEYWORDS.critical);
  if (criticalResult.score > 0) return 'critical';

  const highResult = scoreText(text, URGENCY_KEYWORDS.high);
  if (highResult.score >= 2) return 'high';
  if (highResult.score === 1) return 'high';

  const lowResult = scoreText(text, URGENCY_KEYWORDS.low);
  if (lowResult.score >= 2) return 'low';

  return 'medium';
}

/**
 * Extract tags from text
 */
function extractTags(text, department, urgency) {
  const tags = new Set();
  const lower = text.toLowerCase();

  // Add department and urgency as base tags
  tags.add(department);
  if (urgency === 'critical' || urgency === 'high') tags.add('priority');

  // Technical tags
  const techTags = {
    'api': ['api', 'endpoint', 'rest', 'webhook'],
    'login': ['login', 'sign in', 'signin', 'authentication', 'password'],
    'payment': ['payment', 'charge', 'refund', 'billing', 'invoice'],
    'performance': ['slow', 'performance', 'timeout', 'latency'],
    'bug': ['bug', 'error', 'crash', 'broken', 'exception'],
    'feature-request': ['feature', 'request', 'suggestion', 'would like', 'could you'],
    'data': ['data', 'database', 'record', 'missing data', 'incorrect'],
    'security': ['security', 'breach', 'hacked', 'unauthorized', 'access'],
    'mobile': ['mobile', 'app', 'ios', 'android', 'phone'],
    'billing': ['invoice', 'payment', 'subscription', 'plan', 'charge'],
  };

  for (const [tag, keywords] of Object.entries(techTags)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      tags.add(tag);
    }
  }

  return Array.from(tags);
}

/**
 * Compute SLA deadline
 */
function computeSLADeadline(urgency, createdAt = new Date()) {
  const hours = SLA_HOURS[urgency] || 24;
  const deadline = new Date(createdAt);
  deadline.setHours(deadline.getHours() + hours);
  return deadline;
}

/**
 * Compute priority score for sorting
 * Higher = more urgent
 */
function computePriorityScore(urgency, createdAt) {
  const urgencyScores = { critical: 1000, high: 100, medium: 10, low: 1 };
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  return (urgencyScores[urgency] || 10) + Math.floor(ageHours);
}

/**
 * Main triage function
 * Returns: { urgency, department, tags, category, slaDeadline, priorityScore }
 */
function triageTicket(subject, description) {
  const fullText = `${subject} ${description}`;

  const urgency = detectUrgency(fullText);
  const department = detectDepartment(fullText);
  const tags = extractTags(fullText, department, urgency);
  const slaDeadline = computeSLADeadline(urgency);
  const priorityScore = computePriorityScore(urgency, new Date());

  // Category is same as department for now, could be extended
  const category = department;

  return {
    urgency,
    department,
    tags,
    category,
    slaDeadline,
    priorityScore,
  };
}

module.exports = {
  triageTicket,
  computeSLADeadline,
  computePriorityScore,
  SLA_HOURS,
};
