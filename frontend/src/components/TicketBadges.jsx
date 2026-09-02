import { formatDistanceToNow, isPast } from 'date-fns';

export function UrgencyBadge({ urgency }) {
  return <span className={`badge badge-${urgency}`}>{urgency}</span>;
}

export function StatusBadge({ status }) {
  const labels = {
    open: 'Open',
    in_progress: 'In Progress',
    pending_client: 'Pending Client',
    resolved: 'Resolved',
    closed: 'Closed',
  };
  return <span className={`badge badge-${status}`}>{labels[status] || status}</span>;
}

export function SLAIndicator({ ticket }) {
  if (!ticket.slaDeadline) return null;

  const deadline = new Date(ticket.slaDeadline);
  const breached = ticket.slaBreached || isPast(deadline);
  const isResolved = ['resolved', 'closed'].includes(ticket.status);

  if (isResolved) return null;

  if (breached) {
    return <span className="sla-breach">⚠ SLA Breached</span>;
  }

  const hoursLeft = (deadline - Date.now()) / (1000 * 60 * 60);
  if (hoursLeft < 1) {
    return <span className="sla-warn">⏱ {formatDistanceToNow(deadline)} left</span>;
  }
  if (hoursLeft < 4) {
    return <span className="sla-warn">⏱ {formatDistanceToNow(deadline)} left</span>;
  }

  return <span className="sla-ok">✓ SLA: {formatDistanceToNow(deadline)} left</span>;
}

export function TagList({ tags = [] }) {
  if (!tags.length) return null;
  return (
    <div className="tags">
      {tags.map((t) => (
        <span key={t} className="badge badge-tag">{t}</span>
      ))}
    </div>
  );
}
