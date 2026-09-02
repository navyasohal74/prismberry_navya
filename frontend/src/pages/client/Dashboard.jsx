import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { UrgencyBadge, StatusBadge, SLAIndicator } from '../../components/TicketBadges';

export default function ClientDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, t] = await Promise.all([
          api.get('/stats/client'),
          api.get('/tickets?limit=5&sort=-createdAt'),
        ]);
        setStats(s.data.stats);
        setRecent(t.data.tickets);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;

  const statCards = [
    { label: 'Total',       value: stats?.total      ?? 0, icon: '🎫', bg: 'var(--brand-light)',  color: 'var(--brand)' },
    { label: 'Open',        value: stats?.open        ?? 0, icon: '📬', bg: 'var(--blue-bg)',      color: 'var(--blue)' },
    { label: 'In Progress', value: stats?.inProgress  ?? 0, icon: '⚙️',  bg: 'var(--purple-bg)',   color: 'var(--purple)' },
    { label: 'Resolved',    value: stats?.resolved    ?? 0, icon: '✅', bg: 'var(--green-bg)',     color: 'var(--green)' },
    { label: 'Closed',      value: stats?.closed      ?? 0, icon: '🔒', bg: 'var(--bg-muted)',     color: 'var(--text-muted)' },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Welcome back, {user?.name} 👋</h1>
          <p>Here's the status of your HelpFlow support requests</p>
        </div>
        <Link to="/client/tickets/new" className="btn btn-primary">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 4v16m8-8H4"/></svg>
          New Ticket
        </Link>
      </div>

      <div className="stats-grid">
        {statCards.map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Recent Tickets</h2>
          <Link to="/client/tickets" className="btn btn-ghost btn-sm">View all →</Link>
        </div>
        <div className="table-wrap">
          {recent.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎫</div>
              <h3>No tickets yet</h3>
              <p><Link to="/client/tickets/new" style={{ color: 'var(--brand)', fontWeight: 600 }}>Submit your first ticket</Link></p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Ticket #</th>
                  <th>Subject</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th>SLA</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((t) => (
                  <tr key={t._id} className={`row-${t.urgency}`}>
                    <td><Link to={`/client/tickets/${t._id}`} className="ticket-link">{t.ticketNumber}</Link></td>
                    <td style={{ maxWidth: 260 }}>
                      <Link to={`/client/tickets/${t._id}`} style={{ color: 'var(--text)', fontWeight: 500, textDecoration: 'none' }}>{t.subject}</Link>
                    </td>
                    <td><UrgencyBadge urgency={t.urgency} /></td>
                    <td><StatusBadge status={t.status} /></td>
                    <td><SLAIndicator ticket={t} /></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
