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
  const [reply, setReply]   = useState('');
  const [sending, setSending] = useState(false);

  const fetch = async () => {
    try { const { data } = await api.get(`/tickets/${id}`); setTicket(data.ticket); }
    catch { toast.error('Ticket not found'); navigate('/client/tickets'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [id]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try { await api.post(`/tickets/${id}/comments`, { message: reply }); setReply(''); toast.success('Reply sent'); fetch(); }
    catch { toast.error('Failed to send'); }
    finally { setSending(false); }
  };

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;
  if (!ticket) return null;

  const pub = ticket.comments.filter((c) => !c.isInternal);

  return (
    <div>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }} onClick={() => navigate('/client/tickets')}>← Back to tickets</button>

      <div className="ticket-detail">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Main card */}
          <div className="card">
            <div className="card-body">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--brand)', background: 'var(--brand-light)', padding: '3px 10px', borderRadius: 'var(--r-full)', border: '1px solid var(--blue-border)' }}>{ticket.ticketNumber}</span>
                <UrgencyBadge urgency={ticket.urgency} />
                <StatusBadge status={ticket.status} />
                {ticket.slaBreached && <span className="badge badge-sla">⚠ SLA Breached</span>}
                {ticket.escalated   && <span className="badge badge-critical">Escalated</span>}
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: -.4, marginBottom: 16 }}>{ticket.subject}</h2>
              <div style={{ background: 'var(--bg-muted)', borderRadius: 'var(--r)', padding: '16px 20px', whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: 14, color: 'var(--text-2)', marginBottom: 16 }}>{ticket.description}</div>
              {ticket.attachments?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.5px' }}>Attachments</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {ticket.attachments.map((a, i) => <a key={i} href={`http://localhost:5000${a.path}`} target="_blank" rel="noreferrer" className="badge badge-tag" style={{ textDecoration: 'none' }}>📎 {a.originalName}</a>)}
                  </div>
                </div>
              )}
              <TagList tags={ticket.tags} />
            </div>
          </div>

          {/* Thread */}
          <div className="card">
            <div className="card-header">
              <h2>Conversation</h2>
              <span className="chip">{pub.length} {pub.length === 1 ? 'reply' : 'replies'}</span>
            </div>
            <div className="card-body">
              {pub.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No replies yet. An agent will respond shortly.</p>
              ) : (
                <div className="comments-list">
                  {pub.map((c) => (
                    <div key={c._id} className={`comment ${c.authorRole === 'agent' ? 'agent-comment' : 'client-comment'}`}>
                      <div className="comment-header-bar">
                        <span className="comment-author">{c.authorRole === 'agent' ? '🎧 ' : '👤 '}{c.authorName} <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12 }}>({c.authorRole})</span></span>
                        <span className="comment-time">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                      </div>
                      <div className="comment-body-wrap"><div className="comment-body">{c.message}</div></div>
                    </div>
                  ))}
                </div>
              )}
              {!['resolved','closed'].includes(ticket.status) && (
                <form onSubmit={handleReply} style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">Add a reply</label>
                    <textarea className="form-control" placeholder="Type your reply…" value={reply} onChange={(e) => setReply(e.target.value)} style={{ minHeight: 100 }} />
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={sending || !reply.trim()}>{sending ? 'Sending…' : 'Send Reply →'}</button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="card">
          <div className="card-header"><h2>Details</h2></div>
          <div className="card-body">
            <div className="info-row"><span className="info-label">Status</span><span className="info-value"><StatusBadge status={ticket.status} /></span></div>
            <div className="info-row"><span className="info-label">Urgency</span><span className="info-value"><UrgencyBadge urgency={ticket.urgency} /></span></div>
            <div className="info-row"><span className="info-label">Department</span><span className="info-value" style={{ textTransform: 'capitalize' }}>{ticket.department}</span></div>
            <div className="info-row"><span className="info-label">Assigned Agent</span><span className="info-value">{ticket.agentName || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</span></div>
            <div className="info-row">
              <span className="info-label">SLA</span>
              <span className="info-value"><SLAIndicator ticket={ticket} /></span>
              {ticket.slaDeadline && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Due {format(new Date(ticket.slaDeadline), 'MMM d, HH:mm')}</span>}
            </div>
            <div className="info-row"><span className="info-label">Submitted</span><span className="info-value">{format(new Date(ticket.createdAt), 'MMM d, yyyy HH:mm')}</span></div>
            {ticket.firstResponseAt && <div className="info-row"><span className="info-label">First Response</span><span className="info-value">{ticket.responseTimeMinutes} min</span></div>}
            {ticket.resolvedAt && <div className="info-row"><span className="info-label">Resolved</span><span className="info-value">{format(new Date(ticket.resolvedAt), 'MMM d, HH:mm')}</span></div>}
          </div>
        </div>
      </div>
    </div>
  );
}
