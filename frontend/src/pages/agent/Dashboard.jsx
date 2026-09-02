import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { UrgencyBadge, StatusBadge, SLAIndicator } from '../../components/TicketBadges';

export default function AgentDashboard() {
  const { user } = useAuth();
  const [stats, setStats]     = useState(null);
  const [critical, setCritical] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [s, c] = await Promise.all([
        api.get('/stats/agent'),
        api.get('/tickets?urgency=critical&status=open&limit=5&sort=-createdAt'),
      ]);
      setStats(s.data.stats);
      setCritical(c.data.tickets);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 30000);
    return () => clearInterval(t);
  }, []);

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;

  const statCards = [
    { label: 'Open',         value: stats?.totalOpen        ?? 0, icon: '📬', bg: 'var(--blue-bg)',    color: 'var(--blue)' },
    { label: 'In Progress',  value: stats?.totalInProgress  ?? 0, icon: '⚙️',  bg: 'var(--purple-bg)', color: 'var(--purple)' },
    { label: 'Resolved',     value: stats?.totalResolved    ?? 0, icon: '✅', bg: 'var(--green-bg)',   color: 'var(--green)' },
    { label: 'Critical',     value: stats?.criticalCount    ?? 0, icon: '🔴', bg: 'var(--red-bg)',     color: 'var(--red)' },
    { label: 'SLA Breached', value: stats?.slaBreached      ?? 0, icon: '⏰', bg: 'var(--orange-bg)',  color: 'var(--orange)' },
    { label: 'Escalated',    value: stats?.escalated        ?? 0, icon: '⬆️',  bg: 'var(--red-bg)',     color: 'var(--red)' },
    { label: 'My Active',    value: stats?.myActiveTickets  ?? 0, icon: '👤', bg: 'var(--brand-light)','color': 'var(--brand)' },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Agent Dashboard</h1>
          <p>Welcome back, <strong>{user?.name}</strong> · <span style={{ textTransform: 'capitalize' }}>{user?.department}</span> department · <span style={{ color: 'var(--green)', fontWeight: 600 }}>● Live</span></p>
        </div>
        <Link to="/agent/tickets" className="btn btn-primary">View All Tickets →</Link>
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

      {stats?.byDepartment?.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><h2>Open Tickets by Department</h2></div>
          <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {stats.byDepartment.map((d) => (
              <div key={d._id} className="dept-pill">
                <div className="dept-count">{d.count}</div>
                <div className="dept-name">{d._id}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2>🚨 Critical Queue</h2>
          <Link to="/agent/tickets?urgency=critical" className="btn btn-ghost btn-sm">View all →</Link>
        </div>
        <div className="table-wrap">
          {critical.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <h3>No critical tickets</h3>
              <p>All clear on the critical queue.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr><th>Ticket</th><th>Subject</th><th>Client</th><th>Dept</th><th>Status</th><th>SLA</th><th>Age</th></tr>
              </thead>
              <tbody>
                {critical.map((t) => (
                  <tr key={t._id} className="row-critical">
                    <td><Link to={`/agent/tickets/${t._id}`} className="ticket-link">{t.ticketNumber}</Link></td>
                    <td style={{ maxWidth: 220 }}><Link to={`/agent/tickets/${t._id}`} style={{ color: 'var(--text)', fontWeight: 500, textDecoration: 'none' }}>{t.subject}</Link></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t.clientName}</td>
                    <td style={{ textTransform: 'capitalize', color: 'var(--text-muted)', fontSize: 13 }}>{t.department}</td>
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
