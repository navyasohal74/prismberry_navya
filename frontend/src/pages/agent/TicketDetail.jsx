import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { UrgencyBadge, StatusBadge, SLAIndicator, TagList } from '../../components/TicketBadges';

const STATUSES = ['open', 'in_progress', 'pending_client', 'resolved', 'closed'];
const URGENCIES = ['low', 'medium', 'high', 'critical'];
const DEPARTMENTS = ['general', 'billing', 'technical', 'sales', 'escalations'];

// Smart reply suggestions based on status/urgency
function getSuggestions(ticket) {
  const suggestions = [];
  if (ticket.status === 'open') {
    suggestions.push(`Hi ${ticket.clientName}, I've reviewed your ticket and I'm looking into this for you. I'll have an update for you shortly.`);
    suggestions.push(`Thank you for reaching out. I'm investigating the issue described and will get back to you within the SLA window.`);
  }
  if (ticket.urgency === 'critical' || ticket.urgency === 'high') {
    suggestions.push(`I understand the urgency of this issue. This has been escalated internally and our team is actively working on a resolution.`);
  }
  if (ticket.status === 'in_progress') {
    suggestions.push(`I've made progress on your issue. Here's a quick update on what we've found so far and the next steps.`);
  }
  if (ticket.department === 'billing') {
    suggestions.push(`I've reviewed your billing account and I'm looking into the charge/refund in question. I'll have a resolution for you shortly.`);
  }
  suggestions.push(`Could you please provide additional information or screenshots so we can resolve this faster?`);
  return suggestions;
}

export default function AgentTicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState([]);
  const [reply, setReply] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [controls, setControls] = useState({ status: '', urgency: '', department: '', assignedAgent: '' });

  const fetchTicket = async () => {
    try {
      const { data } = await api.get(`/tickets/${id}`);
      setTicket(data.ticket);
      setControls({
        status: data.ticket.status,
        urgency: data.ticket.urgency,
        department: data.ticket.department,
        assignedAgent: data.ticket.assignedAgent?._id || '',
      });
    } catch (err) {
      toast.error('Ticket not found');
      navigate('/agent/tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
    api.get('/users/agents').then(({ data }) => setAgents(data.agents)).catch(() => {});
  }, [id]);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      await api.put(`/tickets/${id}`, {
        ...controls,
        ...(reply.trim() ? { comment: reply, isInternal } : {}),
      });
      setReply('');
      toast.success('Ticket updated');
      fetchTicket();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleQuickReply = async (msg) => {
    setSending(true);
    try {
      await api.post(`/tickets/${id}/comments`, { message: msg });
      toast.success('Reply sent');
      fetchTicket();
    } catch (err) {
      toast.error('Failed');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;
  if (!ticket) return null;

  const suggestions = getSuggestions(ticket);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/agent/tickets')}>← Back to tickets</button>
      </div>

      <div className="ticket-detail">
        {/* Main column */}
        <div>
          {/* Ticket header */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{ticket.ticketNumber}</span>
                  <UrgencyBadge urgency={ticket.urgency} />
                  <StatusBadge status={ticket.status} />
                  {ticket.slaBreached && <span className="badge badge-sla">SLA Breached</span>}
                  {ticket.escalated && <span className="badge badge-critical">Escalated ×{ticket.escalationCount}</span>}
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{ticket.subject}</h2>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  From <strong>{ticket.clientName}</strong> ({ticket.clientEmail}) · {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                </div>
              </div>
            </div>
            <div className="card-body">
              <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '16px 20px', marginBottom: 16, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                {ticket.description}
              </div>
              {ticket.attachments?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Attachments ({ticket.attachments.length})</p>
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
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><h2>Thread ({ticket.comments.length})</h2></div>
            <div className="card-body">
              {ticket.comments.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No replies yet.</p>
              ) : (
                <div className="comments-list">
                  {ticket.comments.map((c) => (
                    <div key={c._id} className={`comment ${c.authorRole === 'agent' ? 'agent-comment' : 'client-comment'} ${c.isInternal ? 'internal' : ''}`}>
                      <div className="comment-header">
                        <span className="comment-author">
                          {c.authorRole === 'agent' ? '🎧 ' : c.authorRole === 'system' ? '⚙️ ' : '👤 '}{c.authorName}
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6 }}>({c.authorRole})</span>
                          {c.isInternal && <span className="badge" style={{ marginLeft: 6, background: '#fef3c7', color: '#92400e', fontSize: 10 }}>Internal</span>}
                        </span>
                        <span className="comment-time">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                      </div>
                      <div className="comment-body">{c.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Reply box */}
          <div className="card">
            <div className="card-header"><h2>Reply / Update</h2></div>
            <div className="card-body">
              {/* Suggestions */}
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>💡 Suggested replies:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      className="btn btn-secondary btn-xs"
                      style={{ textAlign: 'left', whiteSpace: 'normal', height: 'auto', padding: '6px 10px', fontSize: 12 }}
                      onClick={() => setReply(s)}
                    >
                      {s.length > 100 ? s.slice(0, 100) + '…' : s}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                className="form-control"
                placeholder="Type your reply…"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                style={{ minHeight: 120, marginBottom: 10 }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', marginBottom: 16 }}>
                <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} />
                Internal note (not visible to client)
              </label>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {/* Status quick buttons */}
                {ticket.status !== 'in_progress' && (
                  <button className="btn btn-secondary btn-sm" onClick={() => { setControls((c) => ({ ...c, status: 'in_progress' })); }}>
                    → Mark In Progress
                  </button>
                )}
                {ticket.status !== 'resolved' && (
                  <button className="btn btn-success btn-sm" onClick={() => { setControls((c) => ({ ...c, status: 'resolved' })); }}>
                    ✓ Resolve
                  </button>
                )}
                {ticket.status !== 'pending_client' && (
                  <button className="btn btn-secondary btn-sm" onClick={() => { setControls((c) => ({ ...c, status: 'pending_client' })); }}>
                    ⏳ Pending Client
                  </button>
                )}
                <button className="btn btn-primary btn-sm" disabled={updating} onClick={handleUpdate}>
                  {updating ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div>
          {/* Controls */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><h2>Controls</h2></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Status</label>
                <select className="form-control" value={controls.status} onChange={(e) => setControls((c) => ({ ...c, status: e.target.value }))}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Urgency</label>
                <select className="form-control" value={controls.urgency} onChange={(e) => setControls((c) => ({ ...c, urgency: e.target.value }))}>
                  {URGENCIES.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Department</label>
                <select className="form-control" value={controls.department} onChange={(e) => setControls((c) => ({ ...c, department: e.target.value }))}>
                  {DEPARTMENTS.map((d) => <option key={d} value={d} style={{ textTransform: 'capitalize' }}>{d}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Assigned Agent</label>
                <select className="form-control" value={controls.assignedAgent} onChange={(e) => setControls((c) => ({ ...c, assignedAgent: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {agents.map((a) => (
                    <option key={a._id} value={a._id}>{a.name} ({a.department}, {a.activeTicketCount} tickets)</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="card">
            <div className="card-header"><h2>Info</h2></div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 2 }}>Client</div>
                  <strong>{ticket.clientName}</strong>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ticket.clientEmail}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 2 }}>SLA</div>
                  <SLAIndicator ticket={ticket} />
                  {ticket.slaDeadline && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      Due: {format(new Date(ticket.slaDeadline), 'MMM d, HH:mm')}
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 2 }}>Created</div>
                  <strong>{format(new Date(ticket.createdAt), 'MMM d, yyyy HH:mm')}</strong>
                </div>
                {ticket.firstResponseAt && (
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 2 }}>First Response</div>
                    <strong>{ticket.responseTimeMinutes} min</strong>
                  </div>
                )}
                {ticket.resolvedAt && (
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 2 }}>Resolution Time</div>
                    <strong>{ticket.resolutionTimeMinutes} min</strong>
                  </div>
                )}
                <hr className="divider" style={{ margin: '4px 0' }} />
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 6 }}>Tags</div>
                  <TagList tags={ticket.tags} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
