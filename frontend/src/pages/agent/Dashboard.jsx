import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { UrgencyBadge, StatusBadge, SLAIndicator } from '../../components/TicketBadges';

export default function AgentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [critical, setCritical] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, criticalRes] = await Promise.all([
          api.get('/stats/agent'),
          api.get('/tickets?urgency=critical&status=open&limit=5&sort=-createdAt'),
        ]);
        setStats(statsRes.data.stats);
        setCritical(criticalRes.data.tickets);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Auto-refresh every 30s for real-time feel
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;

  const statCards = [
    { label: 'Open', value: stats?.totalOpen ?? 0, color: '#3b82f6', bg: '#dbeafe' },
    { label: 'In Progress', value: stats?.totalInProgress ?? 0, color: '#8b5cf6', bg: '#ede9fe' },
    { label: 'Resolved', value: stats?.totalResolved ?? 0, color: '#10b981', bg: '#d1fae5' },
    { label: 'Critical', value: stats?.criticalCount ?? 0, color: '#ef4444', bg: '#fee2e2' },
    { label: 'SLA Breached', value: stats?.slaBreached ?? 0, color: '#f97316', bg: '#ffedd5' },
    { label: 'Escalated', value: stats?.escalated ?? 0, color: '#dc2626', bg: '#fecaca' },
    { label: 'My Active', value: stats?.myActiveTickets ?? 0, color: '#6366f1', bg: '#e0e7ff' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Agent Dashboard</h1>
          <p>Welcome, {user?.name} · {user?.department} department</p>
        </div>
        <Link to="/agent/tickets" className="btn btn-primary">View All Tickets</Link>
      </div>

      <div className="stats-grid">
        {statCards.map((s) => (
          <div className="stat-card" key={s.label} style={{ borderTop: `3px solid ${s.color}` }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* By department */}
      {stats?.byDepartment?.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><h2>Open Tickets by Department</h2></div>
          <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {stats.byDepartment.map((d) => (
              <div key={d._id} style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 20px', minWidth: 130 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize', marginBottom: 4 }}>{d._id}</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{d.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Critical tickets */}
      <div className="card">
        <div className="card-header">
          <h2>🚨 Critical Tickets</h2>
          <Link to="/agent/tickets?urgency=critical" className="btn btn-secondary btn-sm">View all critical</Link>
        </div>
        <div className="table-wrap">
          {critical.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <h3>✅ No critical tickets</h3>
              <p>You're all clear on the critical queue.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Ticket #</th>
                  <th>Subject</th>
                  <th>Client</th>
                  <th>Dept</th>
                  <th>Status</th>
                  <th>SLA</th>
                  <th>Age</th>
                </tr>
              </thead>
              <tbody>
                {critical.map((t) => (
                  <tr key={t._id} className="row-critical">
                    <td><Link to={`/agent/tickets/${t._id}`} className="ticket-link">{t.ticketNumber}</Link></td>
                    <td style={{ maxWidth: 220 }}><Link to={`/agent/tickets/${t._id}`} className="ticket-link" style={{ color: 'var(--text)' }}>{t.subject}</Link></td>
                    <td className="text-sm">{t.clientName}</td>
                    <td className="text-sm" style={{ textTransform: 'capitalize' }}>{t.department}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td><SLAIndicator ticket={t} /></td>
                    <td className="text-sm text-muted">{formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}</td>
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
