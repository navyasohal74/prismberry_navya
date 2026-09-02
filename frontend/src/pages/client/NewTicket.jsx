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
      toast.success('Ticket submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setLoading(false);
    }
  };

  if (ack) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ marginBottom: 12, fontSize: 20 }}>Ticket Submitted!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.8 }}>{ack.message}</p>
          <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '16px 20px', textAlign: 'left', marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Ticket #</span><br /><strong>{ack.ticket.ticketNumber}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Urgency</span><br /><span className={`badge badge-${ack.ticket.urgency}`}>{ack.ticket.urgency}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Department</span><br /><strong style={{ textTransform: 'capitalize' }}>{ack.ticket.department}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Assigned to</span><br /><strong>{ack.ticket.agentName || 'Pending assignment'}</strong></div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => { setAck(null); setForm({ subject: '', description: '' }); setFiles([]); }}>Submit another</button>
            <button className="btn btn-primary" onClick={() => navigate(`/client/tickets/${ack.ticket._id}`)}>View ticket</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1>New Support Ticket</h1>
          <p>Describe your issue and we'll route it to the right team</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Subject *</label>
              <input
                className="form-control"
                placeholder="Brief summary of your issue"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                required
                maxLength={200}
              />
              <span className="form-error" style={{ color: 'var(--text-muted)', fontSize: 11 }}>{form.subject.length}/200</span>
            </div>

            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea
                className="form-control"
                placeholder="Please provide as much detail as possible: what happened, what you expected, any error messages, steps to reproduce…"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
                style={{ minHeight: 160 }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Attachments <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional, max 5 files, 10 MB each)</span></label>
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.doc,.docx,.xls,.xlsx,.zip"
                onChange={(e) => setFiles(Array.from(e.target.files))}
                className="form-control"
                style={{ cursor: 'pointer' }}
              />
              {files.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {files.map((f, i) => (
                    <span key={i} className="badge badge-tag">{f.name}</span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#166534' }}>
              💡 <strong>Tip:</strong> Include error messages, screenshots, and steps to reproduce for faster resolution. Your ticket will be automatically classified and assigned.
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/client/dashboard')}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Submitting…' : 'Submit Ticket'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
