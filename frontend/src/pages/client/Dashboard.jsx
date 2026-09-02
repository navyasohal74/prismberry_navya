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
    const fetchData = async () => {
      try {
        const [statsRes, ticketsRes] = await Promise.all([
          api.get('/stats/client'),
          api.get('/tickets?limit=5&sort=-createdAt'),
        ]);
        setStats(statsRes.data.stats);
        setRecent(ticketsRes.data.tickets);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Welcome back, {user?.name} 👋</h1>
          <p>Here's the status of your support requests</p>
        </div>
        <Link to="/client/tickets/new" className="btn btn-primary">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 4v16m8-8H4" /></svg>
          New Ticket
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: 'Total', value: stats?.total ?? 0, color: '#6366f1' },
          { label: 'Open', value: stats?.open ?? 0, color: '#3b82f6' },
          { label: 'In Progress', value: stats?.inProgress ?? 0, color: '#8b5cf6' },
          { label: 'Resolved', value: stats?.resolved ?? 0, color: '#10b981' },
          { label: 'Closed', value: stats?.closed ?? 0, color: '#64748b' },
        ].map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Recent tickets */}
      <div className="card">
        <div className="card-header">
          <h2>Recent Tickets</h2>
          <Link to="/client/tickets" className="btn btn-secondary btn-sm">View all</Link>
        </div>
        <div className="table-wrap">
          {recent.length === 0 ? (
            <div className="empty-state">
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              <h3>No tickets yet</h3>
              <p><Link to="/client/tickets/new">Submit your first ticket</Link></p>
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
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((t) => (
                  <tr key={t._id} className={`row-${t.urgency}`}>
                    <td><Link to={`/client/tickets/${t._id}`} className="ticket-link">{t.ticketNumber}</Link></td>
                    <td style={{ maxWidth: 220 }}><Link to={`/client/tickets/${t._id}`} className="ticket-link" style={{ color: 'var(--text)' }}>{t.subject}</Link></td>
                    <td><UrgencyBadge urgency={t.urgency} /></td>
                    <td><StatusBadge status={t.status} /></td>
                    <td><SLAIndicator ticket={t} /></td>
                    <td className="text-muted text-sm">{formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}</td>
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
