import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export default function NewTicket() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ subject: '', description: '' });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ack, setAck] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) {
      toast.error('Subject and description are required');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('subject', form.subject);
      fd.append('description', form.description);
      files.forEach((f) => fd.append('attachments', f));
      const { data } = await api.post('/tickets', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAck(data);
      toast.success('Ticket submitted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setLoading(false);
    }
  };

  if (ack) {
    return (
      <div style={{ maxWidth: 580, margin: '0 auto' }}>
        <div className="card" style={{ padding: '48px 40px', textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(0,200,150,.12)', border: '2px solid rgba(0,200,150,.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', fontSize: 28
          }}>✓</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, letterSpacing: -0.5 }}>Ticket Submitted!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: 14 }}>{ack.message}</p>

          <div className="ack-grid">
            <div className="ack-item">
              <div className="ack-label">Ticket #</div>
              <div className="ack-value" style={{ color: 'var(--primary)' }}>{ack.ticket.ticketNumber}</div>
            </div>
            <div className="ack-item">
              <div className="ack-label">Urgency</div>
              <div className="ack-value"><span className={`badge badge-${ack.ticket.urgency}`}>{ack.ticket.urgency}</span></div>
            </div>
            <div className="ack-item">
              <div className="ack-label">Department</div>
              <div className="ack-value" style={{ textTransform: 'capitalize' }}>{ack.ticket.department}</div>
            </div>
            <div className="ack-item">
              <div className="ack-label">Assigned to</div>
              <div className="ack-value">{ack.ticket.agentName || 'Pending assignment'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-ghost" onClick={() => { setAck(null); setForm({ subject: '', description: '' }); setFiles([]); }}>
              Submit another
            </button>
            <button className="btn btn-primary" onClick={() => navigate(`/client/tickets/${ack.ticket._id}`)}>
              View ticket →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1>New Support Ticket</h1>
          <p>Describe your issue — we'll route it to the right team automatically</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="tip-box">
            💡 The more detail you include, the faster we can resolve your issue. We'll auto-detect urgency and assign the right team.
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Subject <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input
                className="form-control"
                placeholder="Brief summary of your issue"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                required
                maxLength={200}
              />
              <span className="form-hint">{form.subject.length}/200 characters</span>
            </div>

            <div className="form-group">
              <label className="form-label">Description <span style={{ color: 'var(--danger)' }}>*</span></label>
              <textarea
                className="form-control"
                placeholder="Describe what happened, what you expected, any error messages, and steps to reproduce…"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
                style={{ minHeight: 160 }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Attachments
                <span className="form-hint" style={{ marginLeft: 8, textTransform: 'none' }}>optional · max 5 files · 10 MB each</span>
              </label>
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.doc,.docx,.xls,.xlsx,.zip"
                onChange={(e) => setFiles(Array.from(e.target.files))}
                className="form-control"
                style={{ cursor: 'pointer', paddingTop: 8 }}
              />
              {files.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {files.map((f, i) => (
                    <span key={i} className="badge badge-tag">📎 {f.name}</span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/client/dashboard')}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Submitting…' : 'Submit Ticket →'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
