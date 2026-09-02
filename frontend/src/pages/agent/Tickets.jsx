import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { UrgencyBadge, StatusBadge, SLAIndicator } from '../../components/TicketBadges';

export default function AgentTickets() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    urgency: searchParams.get('urgency') || '',
    department: '',
    status: '',
    assignedAgent: '',
    search: '',
    page: 1,
  });

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 20, sort: '-priorityScore,-createdAt', page: filters.page });
      if (filters.urgency) params.append('urgency', filters.urgency);
      if (filters.department) params.append('department', filters.department);
      if (filters.status) params.append('status', filters.status);
      if (filters.assignedAgent) params.append('assignedAgent', filters.assignedAgent);
      const { data } = await api.get(`/tickets?${params}`);
      setTickets(data.tickets);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, [filters]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(fetchTickets, 30000);
    return () => clearInterval(interval);
  }, [filters]);

  const totalPages = Math.ceil(total / 20);

  const filtered = filters.search
    ? tickets.filter((t) =>
        t.ticketNumber.toLowerCase().includes(filters.search.toLowerCase()) ||
        t.subject.toLowerCase().includes(filters.search.toLowerCase()) ||
        t.clientName?.toLowerCase().includes(filters.search.toLowerCase())
      )
    : tickets;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>All Tickets</h1>
          <p>{total} total · sorted by priority</p>
        </div>
      </div>

      <div className="filters">
        <input
          placeholder="Search by #, subject, client…"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}>
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="pending_client">Pending Client</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select value={filters.urgency} onChange={(e) => setFilters({ ...filters, urgency: e.target.value, page: 1 })}>
          <option value="">All urgencies</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value, page: 1 })}>
          <option value="">All departments</option>
          <option value="billing">Billing</option>
          <option value="technical">Technical</option>
          <option value="general">General</option>
          <option value="sales">Sales</option>
          <option value="escalations">Escalations</option>
        </select>
        <select value={filters.assignedAgent} onChange={(e) => setFilters({ ...filters, assignedAgent: e.target.value, page: 1 })}>
          <option value="">All agents</option>
          <option value="me">Assigned to me</option>
        </select>
        <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ urgency: '', department: '', status: '', assignedAgent: '', search: '', page: 1 })}>
          Clear
        </button>
      </div>

      <div className="card">
        <div className="table-wrap">
          {loading ? (
            <div className="loading-wrap"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              <h3>No tickets found</h3>
              <p>Try adjusting your filters</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Ticket #</th>
                  <th>Subject</th>
                  <th>Client</th>
                  <th>Dept</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th>SLA</th>
                  <th>Agent</th>
                  <th>Created</th>
                  <th>Resp. Time</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t._id} className={`row-${t.urgency}`}>
                    <td>
                      <Link to={`/agent/tickets/${t._id}`} className="ticket-link">{t.ticketNumber}</Link>
                      {t.escalated && <span className="badge badge-critical" style={{ marginLeft: 4, fontSize: 10 }}>ESC</span>}
                    </td>
                    <td style={{ maxWidth: 200 }}>
                      <Link to={`/agent/tickets/${t._id}`} className="ticket-link" style={{ color: 'var(--text)' }}>{t.subject}</Link>
                    </td>
                    <td className="text-sm">{t.clientName}</td>
                    <td className="text-sm" style={{ textTransform: 'capitalize' }}>{t.department}</td>
                    <td><UrgencyBadge urgency={t.urgency} /></td>
                    <td><StatusBadge status={t.status} /></td>
                    <td><SLAIndicator ticket={t} /></td>
                    <td className="text-sm">{t.agentName || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</td>
                    <td className="text-sm text-muted">{formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}</td>
                    <td className="text-sm text-muted">
                      {t.responseTimeMinutes != null ? `${t.responseTimeMinutes}m` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {totalPages > 1 && (
          <div className="pagination">
            <button disabled={filters.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>← Prev</button>
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => (
              <button key={i + 1} className={filters.page === i + 1 ? 'active' : ''} onClick={() => setFilters((f) => ({ ...f, page: i + 1 }))}>{i + 1}</button>
            ))}
            <button disabled={filters.page >= totalPages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
