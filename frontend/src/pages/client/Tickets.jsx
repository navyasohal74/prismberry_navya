import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import api from '../../api/axios';
import { UrgencyBadge, StatusBadge, SLAIndicator } from '../../components/TicketBadges';

export default function ClientTickets() {
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', urgency: '', page: 1 });

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 15, sort: '-createdAt', page: filters.page });
      if (filters.status) params.append('status', filters.status);
      if (filters.urgency) params.append('urgency', filters.urgency);
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

  const totalPages = Math.ceil(total / 15);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Tickets</h1>
          <p>{total} total ticket{total !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/client/tickets/new" className="btn btn-primary">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 4v16m8-8H4" /></svg>
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
      </div>

      <div className="card">
        <div className="table-wrap">
          {loading ? (
            <div className="loading-wrap"><div className="spinner" /></div>
          ) : tickets.length === 0 ? (
            <div className="empty-state">
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              <h3>No tickets found</h3>
              <p>Try adjusting your filters or <Link to="/client/tickets/new">submit a new ticket</Link></p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Ticket #</th>
                  <th>Subject</th>
                  <th>Department</th>
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
                    <td style={{ maxWidth: 240 }}><Link to={`/client/tickets/${t._id}`} className="ticket-link" style={{ color: 'var(--text)' }}>{t.subject}</Link></td>
                    <td className="text-sm" style={{ textTransform: 'capitalize' }}>{t.department}</td>
                    <td><UrgencyBadge urgency={t.urgency} /></td>
                    <td><StatusBadge status={t.status} /></td>
                    <td><SLAIndicator ticket={t} /></td>
                    <td className="text-sm text-muted">{t.agentName || '—'}</td>
                    <td className="text-sm text-muted">{formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {totalPages > 1 && (
          <div className="pagination">
            <button disabled={filters.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>← Prev</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i + 1} className={filters.page === i + 1 ? 'active' : ''} onClick={() => setFilters((f) => ({ ...f, page: i + 1 }))}>{i + 1}</button>
            ))}
            <button disabled={filters.page >= totalPages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
