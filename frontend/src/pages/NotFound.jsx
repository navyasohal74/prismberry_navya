import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NotFound() {
  const { user } = useAuth();
  const home = user?.role === 'agent' ? '/agent/dashboard' : user ? '/client/dashboard' : '/login';
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 64, fontWeight: 700, color: '#cbd5e1' }}>404</h1>
      <p style={{ color: '#64748b' }}>Page not found.</p>
      <Link to={home} className="btn btn-primary">Go home</Link>
    </div>
  );
}
