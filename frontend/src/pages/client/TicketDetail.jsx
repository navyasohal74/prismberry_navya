import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { UrgencyBadge, StatusBadge, SLAIndicator, TagList } from '../../components/TicketBadges';

export default function ClientTicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const fetchTicket = async () => {
    try {
      const { data } = await api.get(`/tickets/${id}`);
      setTicket(data.ticket);
    } catch (err) {
      toast.error('Ticket not found');
      navigate('/client/tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTicket(); }, [id]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      await api.post(`/tickets/${id}/comments`, { message: reply });
      setReply('');
      toast.success('Reply sent');
      fetchTicket();
    } catch (err) {
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;
  if (!ticket) return null;

  const publicComments = ticket.comments.filter((c) => !c.isInternal);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/client/tickets')}>← Back to tickets</button>
      </div>

      <div className="ticket-detail">
        {/* Main */}
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{ticket.ticketNumber}</span>
                  <UrgencyBadge urgency={ticket.urgency} />
                  <StatusBadge status={ticket.status} />
                  {ticket.slaBreached && <span className="badge badge-sla">SLA Breached</span>}
                  {ticket.escalated && <span className="badge badge-critical">Escalated</span>}
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>{ticket.subject}</h2>
              </div>
            </div>
            <div className="card-body">
              <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '16px 20px', marginBottom: 20, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                {ticket.description}
              </div>

              {ticket.attachments?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Attachments</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {ticket.attachments.map((a, i) => (
                      <a key={i} href={`http://localhost:5000${a.path}`} target="_blank" rel="noreferrer" className="badge badge-tag" style={{ textDecoration: 'none' }}>
                        📎 {a.originalName}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <TagList tags={ticket.tags} />
            </div>
          </div>

          {/* Thread */}
          <div className="card">
            <div className="card-header"><h2>Conversation ({publicComments.length})</h2></div>
            <div className="card-body">
              {publicComments.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No replies yet. An agent will respond shortly.</p>
              ) : (
                <div className="comments-list">
                  {publicComments.map((c) => (
                    <div key={c._id} className={`comment ${c.authorRole === 'agent' ? 'agent-comment' : 'client-comment'}`}>
                      <div className="comment-header">
                        <span className="comment-author">
                          {c.authorRole === 'agent' ? '🎧 ' : '👤 '}{c.authorName}
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6, textTransform: 'capitalize' }}>({c.authorRole})</span>
                        </span>
                        <span className="comment-time">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                      </div>
                      <div className="comment-body">{c.message}</div>
                    </div>
                  ))}
                </div>
              )}

              {!['resolved', 'closed'].includes(ticket.status) && (
                <form onSubmit={handleReply} style={{ marginTop: 24 }}>
                  <div className="form-group" style={{ marginBottom: 10 }}>
                    <label className="form-label">Add a reply</label>
                    <textarea
                      className="form-control"
                      placeholder="Type your reply or provide additional information…"
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      style={{ minHeight: 100 }}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={sending || !reply.trim()}>
                    {sending ? 'Sending…' : 'Send Reply'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="card">
            <div className="card-header"><h2>Details</h2></div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 14 }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 2 }}>Status</div>
                  <StatusBadge status={ticket.status} />
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 2 }}>Urgency</div>
                  <UrgencyBadge urgency={ticket.urgency} />
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 2 }}>Department</div>
                  <strong style={{ textTransform: 'capitalize' }}>{ticket.department}</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 2 }}>Assigned agent</div>
                  <strong>{ticket.agentName || 'Unassigned'}</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 2 }}>SLA</div>
                  <SLAIndicator ticket={ticket} />
                  {ticket.slaDeadline && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      Due: {format(new Date(ticket.slaDeadline), 'MMM d, yyyy HH:mm')}
                    </div>
                  )}
                </div>
                <hr className="divider" style={{ margin: '4px 0' }} />
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 2 }}>Submitted</div>
                  <strong>{format(new Date(ticket.createdAt), 'MMM d, yyyy HH:mm')}</strong>
                </div>
                {ticket.firstResponseAt && (
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 2 }}>First response</div>
                    <strong>{ticket.responseTimeMinutes} min</strong>
                  </div>
                )}
                {ticket.resolvedAt && (
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 2 }}>Resolved</div>
                    <strong>{format(new Date(ticket.resolvedAt), 'MMM d, yyyy HH:mm')}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
