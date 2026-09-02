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

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;

  const statCards = [
    { label: 'Open',        value: stats?.totalOpen        ?? 0, color: '#4d9fff' },
    { label: 'In Progress', value: stats?.totalInProgress  ?? 0, color: '#7c6af7' },
    { label: 'Resolved',    value: stats?.totalResolved    ?? 0, color: '#00c896' },
    { label: 'Critical',    value: stats?.criticalCount    ?? 0, color: '#ff4d6d' },
    { label: 'SLA Breached',value: stats?.slaBreached      ?? 0, color: '#f5a623' },
    { label: 'Escalated',   value: stats?.escalated        ?? 0, color: '#ff6b6b' },
    { label: 'My Active',   value: stats?.myActiveTickets  ?? 0, color: '#00d4b8' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Agent Dashboard</h1>
          <p>
            <span className="status-dot" style={{ marginRight: 6 }} />
            {user?.name} · <span style={{ textTransform: 'capitalize' }}>{user?.department}</span> department
          </p>
        </div>
        <Link to="/agent/tickets" className="btn btn-primary">All Tickets →</Link>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {statCards.map((s) => (
          <div className="stat-card" key={s.label} style={{ '--stat-color': s.color }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* By department */}
      {stats?.byDepartment?.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><h2>Open by Department</h2></div>
          <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {stats.byDepartment.map((d) => (
              <div key={d._id} style={{
                background: 'var(--bg-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '16px 20px',
                minWidth: 120,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>{d.count}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize', marginTop: 4, fontWeight: 600 }}>{d._id}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Critical queue */}
      <div className="card">
        <div className="card-header">
          <h2>
            <span style={{ color: 'var(--danger)', marginRight: 6 }}>⚠</span>
            Critical Tickets
          </h2>
          <Link to="/agent/tickets?urgency=critical" className="btn btn-ghost btn-sm">View all →</Link>
        </div>
        <div className="table-wrap">
          {critical.length === 0 ? (
            <div className="empty-state" style={{ padding: 48 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
              <h3>No critical tickets</h3>
              <p>You're all clear on the critical queue.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Ticket</th>
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
                    <td style={{ maxWidth: 220 }}>
                      <Link to={`/agent/tickets/${t._id}`} style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 500 }}>{t.subject}</Link>
                    </td>
                    <td className="text-sm text-muted">{t.clientName}</td>
                    <td className="text-sm" style={{ textTransform: 'capitalize', color: 'var(--text-muted)' }}>{t.department}</td>
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
