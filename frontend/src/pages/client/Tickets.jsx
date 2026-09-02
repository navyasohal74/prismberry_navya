import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import api from '../../api/axios';
import { UrgencyBadge, StatusBadge, SLAIndicator } from '../../components/TicketBadges';

export default function ClientTickets() {
  const [tickets, setTickets] = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', urgency: '', page: 1 });

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: 15, sort: '-createdAt', page: filters.page });
      if (filters.status)  p.append('status',  filters.status);
      if (filters.urgency) p.append('urgency', filters.urgency);
      const { data } = await api.get(`/tickets?${p}`);
      setTickets(data.tickets);
      setTotal(data.total);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTickets(); }, [filters]);

  const pages = Math.ceil(total / 15);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>My Tickets</h1>
          <p>{total} ticket{total !== 1 ? 's' : ''} total</p>
        </div>
        <Link to="/client/tickets/new" className="btn btn-primary">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 4v16m8-8H4"/></svg>
          New Ticket
        </Link>
      </div>

      <div className="filters">
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
        {(filters.status || filters.urgency) && (
          <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ status: '', urgency: '', page: 1 })}>Clear filters</button>
        )}
      </div>

      <div className="card">
        <div className="table-wrap">
          {loading ? (
            <div className="loading-wrap"><div className="spinner" /></div>
          ) : tickets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h3>No tickets found</h3>
              <p>Try adjusting your filters or <Link to="/client/tickets/new" style={{ color: 'var(--brand)', fontWeight: 600 }}>submit a new ticket</Link></p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Ticket #</th>
                  <th>Subject</th>
                  <th>Dept</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th>SLA</th>
                  <th>Agent</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t._id} className={`row-${t.urgency}`}>
                    <td><Link to={`/client/tickets/${t._id}`} className="ticket-link">{t.ticketNumber}</Link></td>
                    <td style={{ maxWidth: 260 }}>
                      <Link to={`/client/tickets/${t._id}`} style={{ color: 'var(--text)', fontWeight: 500, textDecoration: 'none' }}>{t.subject}</Link>
                    </td>
                    <td style={{ textTransform: 'capitalize', color: 'var(--text-muted)', fontSize: 13 }}>{t.department}</td>
                    <td><UrgencyBadge urgency={t.urgency} /></td>
                    <td><StatusBadge status={t.status} /></td>
                    <td><SLAIndicator ticket={t} /></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t.agentName || '—'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {pages > 1 && (
          <div className="pagination">
            <button disabled={filters.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>← Prev</button>
            {Array.from({ length: pages }, (_, i) => (
              <button key={i + 1} className={filters.page === i + 1 ? 'active' : ''} onClick={() => setFilters((f) => ({ ...f, page: i + 1 }))}>{i + 1}</button>
            ))}
            <button disabled={filters.page >= pages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
