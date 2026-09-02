import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NotFound() {
  const { user } = useAuth();
  const home = user?.role === 'agent' ? '/agent/dashboard' : user ? '/client/dashboard' : '/login';
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'var(--bg)' }}>
      <div style={{ fontSize: 72, fontWeight: 800, color: 'var(--border)', letterSpacing: -4 }}>404</div>
      <h2 style={{ fontSize: 20, fontWeight: 700 }}>Page not found</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>The page you're looking for doesn't exist.</p>
      <Link to={home} className="btn btn-primary" style={{ marginTop: 8 }}>← Go home</Link>
    </div>
  );
}
