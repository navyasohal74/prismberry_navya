import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const DEPARTMENTS = ['general', 'billing', 'technical', 'sales', 'escalations'];

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'client', department: 'general' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      login(data.token, data.user);
      toast.success(`Welcome to HelpFlow, ${data.user.name}!`);
      navigate(data.user.role === 'agent' ? '/agent/dashboard' : '/client/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left */}
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-brand-mark">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
          </div>
          <span className="auth-brand-name">HelpFlow</span>
        </div>

        <div className="auth-hero">
          <h2>Your team's support hub starts here.</h2>
          <p>Set up your account in under a minute and start resolving tickets with the power of smart automation.</p>
        </div>

        <div className="auth-features">
          {[
            { icon: '🚀', text: 'Get started in 60 seconds' },
            { icon: '🤖', text: 'AI-powered ticket classification' },
            { icon: '📈', text: 'Track response & resolution times' },
            { icon: '🔒', text: 'Role-based access control' },
          ].map((f) => (
            <div key={f.text} className="auth-feature">
              <div className="auth-feature-icon">{f.icon}</div>
              {f.text}
            </div>
          ))}
        </div>
      </div>

      {/* Right */}
      <div className="auth-right">
        <div className="auth-form-wrap">
          <div className="auth-form-header">
            <h1>Create account</h1>
            <p>Join HelpFlow and start managing support today.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input className="form-control" placeholder="Jane Smith" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input type="email" className="form-control" placeholder="you@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" placeholder="At least 6 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>

            <div className="form-group">
              <label className="form-label">I am a…</label>
              <div className="role-cards">
                {[
                  { value: 'client', icon: '👤', name: 'Client', desc: 'Submit & track tickets' },
                  { value: 'agent',  icon: '🎧', name: 'Support Agent', desc: 'Resolve tickets' },
                ].map((r) => (
                  <label key={r.value} className={`role-card${form.role === r.value ? ' selected' : ''}`}>
                    <input type="radio" name="role" value={r.value} checked={form.role === r.value} onChange={() => setForm({ ...form, role: r.value })} />
                    <div className="role-icon">{r.icon}</div>
                    <div className="role-name">{r.name}</div>
                    <div className="role-desc">{r.desc}</div>
                  </label>
                ))}
              </div>
            </div>

            {form.role === 'agent' && (
              <div className="form-group">
                <label className="form-label">Department</label>
                <select className="form-control" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                </select>
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full" style={{ marginTop: 4, padding: '11px 18px' }} disabled={loading}>
              {loading ? 'Creating account…' : 'Create account →'}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
