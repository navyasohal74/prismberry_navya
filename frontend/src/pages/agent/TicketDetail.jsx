import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { UrgencyBadge, StatusBadge, SLAIndicator, TagList } from '../../components/TicketBadges';

const STATUSES    = ['open', 'in_progress', 'pending_client', 'resolved', 'closed'];
const URGENCIES   = ['low', 'medium', 'high', 'critical'];
const DEPARTMENTS = ['general', 'billing', 'technical', 'sales', 'escalations'];

function getSuggestions(ticket) {
  const suggestions = [];
  if (ticket.status === 'open') {
    suggestions.push(`Hi ${ticket.clientName}, I've reviewed your ticket and I'm looking into this for you. I'll have an update shortly.`);
    suggestions.push(`Thank you for reaching out. I'm investigating the issue and will get back to you within the SLA window.`);
  }
  if (ticket.urgency === 'critical' || ticket.urgency === 'high') {
    suggestions.push(`I understand the urgency. This has been escalated internally and our team is actively working on a resolution.`);
  }
  if (ticket.status === 'in_progress') {
    suggestions.push(`Quick update: I've made progress on your issue. Here are the next steps.`);
  }
  if (ticket.department === 'billing') {
    suggestions.push(`I've reviewed your billing account and I'm looking into the charge in question. I'll have a resolution shortly.`);
  }
  suggestions.push(`Could you provide additional information or screenshots to help us resolve this faster?`);
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
    } catch {
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

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;
  if (!ticket) return null;

  const suggestions = getSuggestions(ticket);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/agent/tickets')}>← Back to tickets</button>
      </div>

      <div className="ticket-detail">
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Header */}
          <div className="card">
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700, fontFamily: 'monospace', background: 'var(--primary-soft)', padding: '3px 10px', borderRadius: 'var(--radius-full)', border: '1px solid rgba(124,106,247,.2)' }}>
                  {ticket.ticketNumber}
                </span>
                <UrgencyBadge urgency={ticket.urgency} />
                <StatusBadge status={ticket.status} />
                {ticket.slaBreached && <span className="badge badge-sla">SLA Breached</span>}
                {ticket.escalated && <span className="badge badge-critical">Escalated ×{ticket.escalationCount}</span>}
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.4, marginBottom: 10 }}>{ticket.subject}</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                From <strong style={{ color: 'var(--text)' }}>{ticket.clientName}</strong>
                <span style={{ color: 'var(--text-light)', marginLeft: 4 }}>({ticket.clientEmail})</span>
                {' · '}{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
              </p>

              <div style={{ background: 'var(--bg-2)', borderRadius: 'var(--radius)', padding: '18px 20px', marginTop: 16, whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: 14, color: 'var(--text-muted)' }}>
                {ticket.description}
              </div>

              {ticket.attachments?.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-light)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.5px' }}>Attachments</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {ticket.attachments.map((a, i) => (
                      <a key={i} href={`http://localhost:5000${a.path}`} target="_blank" rel="noreferrer" className="badge badge-tag" style={{ textDecoration: 'none' }}>
                        📎 {a.originalName}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {ticket.tags?.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <TagList tags={ticket.tags} />
                </div>
              )}
            </div>
          </div>

          {/* Thread */}
          <div className="card">
            <div className="card-header">
              <h2>Thread</h2>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-2)', padding: '3px 10px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border)' }}>
                {ticket.comments.length} {ticket.comments.length === 1 ? 'message' : 'messages'}
              </span>
            </div>
            <div className="card-body">
              {ticket.comments.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No replies yet.</p>
              ) : (
                <div className="comments-list">
                  {ticket.comments.map((c) => (
                    <div key={c._id} className={`comment ${c.authorRole === 'agent' ? 'agent-comment' : c.authorRole === 'system' ? '' : 'client-comment'} ${c.isInternal ? 'internal' : ''}`}>
                      <div className="comment-header">
                        <span className="comment-author">
                          {c.authorRole === 'agent' ? '🎧 ' : c.authorRole === 'system' ? '⚙️ ' : '👤 '}
                          {c.authorName}
                          <span style={{ fontSize: 11, color: 'var(--text-light)', fontWeight: 400, marginLeft: 6, textTransform: 'capitalize' }}>({c.authorRole})</span>
                          {c.isInternal && <span className="badge" style={{ marginLeft: 8, fontSize: 10, background: 'rgba(245,166,35,.12)', color: '#f5a623', border: '1px solid rgba(245,166,35,.2)' }}>Internal</span>}
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
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 10, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '.5px' }}>Suggested replies</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      className="btn btn-ghost btn-xs"
                      style={{ textAlign: 'left', whiteSpace: 'normal', height: 'auto', padding: '8px 12px', fontSize: 12, lineHeight: 1.5 }}
                      onClick={() => setReply(s)}
                    >
                      {s.length > 110 ? s.slice(0, 110) + '…' : s}
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

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', marginBottom: 18, color: 'var(--text-muted)' }}>
                <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} style={{ accentColor: 'var(--warning)' }} />
                Mark as internal note (not visible to client)
              </label>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {ticket.status !== 'in_progress' && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setControls((c) => ({ ...c, status: 'in_progress' }))}>
                    → In Progress
                  </button>
                )}
                {ticket.status !== 'resolved' && (
                  <button className="btn btn-success btn-sm" onClick={() => setControls((c) => ({ ...c, status: 'resolved' }))}>
                    ✓ Resolve
                  </button>
                )}
                {ticket.status !== 'pending_client' && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setControls((c) => ({ ...c, status: 'pending_client' }))}>
                    ⏳ Pending Client
                  </button>
                )}
                <button className="btn btn-primary btn-sm" disabled={updating} onClick={handleUpdate}>
                  {updating ? 'Saving…' : 'Save Changes →'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Controls */}
          <div className="card">
            <div className="card-header"><h2>Controls</h2></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Status</label>
                <select className="form-control" value={controls.status} onChange={(e) => setControls((c) => ({ ...c, status: e.target.value }))}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Urgency</label>
                <select className="form-control" value={controls.urgency} onChange={(e) => setControls((c) => ({ ...c, urgency: e.target.value }))}>
                  {URGENCIES.map((u) => <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Department</label>
                <select className="form-control" value={controls.department} onChange={(e) => setControls((c) => ({ ...c, department: e.target.value }))}>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Assigned Agent</label>
                <select className="form-control" value={controls.assignedAgent} onChange={(e) => setControls((c) => ({ ...c, assignedAgent: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {agents.map((a) => (
                    <option key={a._id} value={a._id}>{a.name} ({a.department} · {a.activeTicketCount} active)</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="card">
            <div className="card-header"><h2>Info</h2></div>
            <div className="card-body">
              <div className="info-row">
                <span className="info-label">Client</span>
                <span className="info-value">{ticket.clientName}</span>
                <span style={{ fontSize: 12, color: 'var(--text-light)' }}>{ticket.clientEmail}</span>
              </div>
              <div className="info-row">
                <span className="info-label">SLA</span>
                <span className="info-value"><SLAIndicator ticket={ticket} /></span>
                {ticket.slaDeadline && (
                  <span style={{ fontSize: 12, color: 'var(--text-light)' }}>Due {format(new Date(ticket.slaDeadline), 'MMM d, HH:mm')}</span>
                )}
              </div>
              <div className="info-row">
                <span className="info-label">Created</span>
                <span className="info-value">{format(new Date(ticket.createdAt), 'MMM d, yyyy HH:mm')}</span>
              </div>
              {ticket.firstResponseAt && (
                <div className="info-row">
                  <span className="info-label">First Response</span>
                  <span className="info-value">{ticket.responseTimeMinutes} min</span>
                </div>
              )}
              {ticket.resolvedAt && (
                <div className="info-row">
                  <span className="info-label">Resolution Time</span>
                  <span className="info-value">{ticket.resolutionTimeMinutes} min</span>
                </div>
              )}
              {ticket.tags?.length > 0 && (
                <div className="info-row">
                  <span className="info-label">Tags</span>
                  <div style={{ marginTop: 6 }}><TagList tags={ticket.tags} /></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
