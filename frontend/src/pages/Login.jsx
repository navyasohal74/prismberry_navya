import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate(data.user.role === 'agent' ? '/agent/dashboard' : '/client/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left panel */}
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
          <h2>Customer support,<br/>made effortless.</h2>
          <p>Triage, route, and resolve tickets automatically with smart workflows built for modern support teams.</p>
        </div>

        <div className="auth-features">
          {[
            { icon: '⚡', text: 'Auto-triage with urgency detection' },
            { icon: '🎯', text: 'Smart routing to the right agent' },
            { icon: '📊', text: 'Real-time SLA monitoring' },
            { icon: '🔔', text: 'Auto-escalation for breached SLAs' },
          ].map((f) => (
            <div key={f.text} className="auth-feature">
              <div className="auth-feature-icon">{f.icon}</div>
              {f.text}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-form-wrap">
          <div className="auth-form-header">
            <h1>Sign in</h1>
            <p>Welcome back — enter your credentials to continue.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                type="email"
                className="form-control"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-full" style={{ marginTop: 4, padding: '11px 18px' }} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          <div className="auth-footer">
            Don't have an account? <Link to="/register">Create one free</Link>
          </div>

          <div style={{ marginTop: 24, padding: '12px 14px', background: 'var(--bg-muted)', borderRadius: 'var(--r-sm)', fontSize: 12.5, color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            <strong style={{ color: 'var(--text-2)' }}>Demo tip:</strong> Register as a <em>client</em> to submit tickets, or as an <em>agent</em> to manage them.
          </div>
        </div>
      </div>
    </div>
  );
}
