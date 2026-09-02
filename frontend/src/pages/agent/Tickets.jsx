import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import api from '../../api/axios';
import { UrgencyBadge, StatusBadge, SLAIndicator } from '../../components/TicketBadges';

export default function AgentTickets() {
  const [searchParams] = useSearchParams();
  const [tickets, setTickets] = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    urgency: searchParams.get('urgency') || '',
    department: '', status: '', assignedAgent: '', search: '', page: 1,
  });

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: 20, sort: '-priorityScore,-createdAt', page: filters.page });
      if (filters.urgency)       p.append('urgency',       filters.urgency);
      if (filters.department)    p.append('department',    filters.department);
      if (filters.status)        p.append('status',        filters.status);
      if (filters.assignedAgent) p.append('assignedAgent', filters.assignedAgent);
      const { data } = await api.get(`/tickets?${p}`);
      setTickets(data.tickets);
      setTotal(data.total);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTickets(); }, [filters]);
  useEffect(() => {
    const t = setInterval(fetchTickets, 30000);
    return () => clearInterval(t);
  }, [filters]);

  const pages = Math.ceil(total / 20);
  const displayed = filters.search
    ? tickets.filter((t) =>
        t.ticketNumber.toLowerCase().includes(filters.search.toLowerCase()) ||
        t.subject.toLowerCase().includes(filters.search.toLowerCase()) ||
        t.clientName?.toLowerCase().includes(filters.search.toLowerCase()))
    : tickets;

  const hasFilters = filters.urgency || filters.department || filters.status || filters.assignedAgent || filters.search;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>All Tickets</h1>
          <p>{total} total · sorted by priority</p>
        </div>
      </div>

      <div className="filters">
        <input placeholder="🔍  Search by #, subject, client…" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
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
        {hasFilters && <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ urgency: '', department: '', status: '', assignedAgent: '', search: '', page: 1 })}>Clear filters</button>}
      </div>

      <div className="card">
        <div className="table-wrap">
          {loading ? (
            <div className="loading-wrap"><div className="spinner" /></div>
          ) : displayed.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h3>No tickets found</h3>
              <p>Try adjusting your filters</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr><th>Ticket</th><th>Subject</th><th>Client</th><th>Dept</th><th>Urgency</th><th>Status</th><th>SLA</th><th>Agent</th><th>Created</th><th>Resp.</th></tr>
              </thead>
              <tbody>
                {displayed.map((t) => (
                  <tr key={t._id} className={`row-${t.urgency}`}>
                    <td>
                      <Link to={`/agent/tickets/${t._id}`} className="ticket-link">{t.ticketNumber}</Link>
                      {t.escalated && <span className="badge badge-critical" style={{ marginLeft: 6, fontSize: 10 }}>ESC</span>}
                    </td>
                    <td style={{ maxWidth: 200 }}><Link to={`/agent/tickets/${t._id}`} style={{ color: 'var(--text)', fontWeight: 500, textDecoration: 'none' }}>{t.subject}</Link></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t.clientName}</td>
                    <td style={{ textTransform: 'capitalize', color: 'var(--text-muted)', fontSize: 13 }}>{t.department}</td>
                    <td><UrgencyBadge urgency={t.urgency} /></td>
                    <td><StatusBadge status={t.status} /></td>
                    <td><SLAIndicator ticket={t} /></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t.agentName || <span style={{ color: 'var(--text-light)' }}>Unassigned</span>}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t.responseTimeMinutes != null ? `${t.responseTimeMinutes}m` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {pages > 1 && (
          <div className="pagination">
            <button disabled={filters.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>← Prev</button>
            {Array.from({ length: Math.min(pages, 10) }, (_, i) => (
              <button key={i+1} className={filters.page === i+1 ? 'active' : ''} onClick={() => setFilters((f) => ({ ...f, page: i+1 }))}>{i+1}</button>
            ))}
            <button disabled={filters.page >= pages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
