import { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Logo = () => (
  <Link to="/" className="nav-logo">
    <div className="nav-logo-mark">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
    </div>
    <span className="nav-logo-text">Help<span>Flow</span></span>
  </Link>
);

const ClientLinks = ({ onClick }) => (
  <>
    <NavLink to="/client/dashboard" onClick={onClick} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
      </svg>
      Dashboard
    </NavLink>
    <NavLink to="/client/tickets" onClick={onClick} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
      </svg>
      My Tickets
    </NavLink>
    <NavLink to="/client/tickets/new" onClick={onClick} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>
      </svg>
      New Ticket
    </NavLink>
  </>
);

const AgentLinks = ({ onClick }) => (
  <>
    <NavLink to="/agent/dashboard" onClick={onClick} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
      </svg>
      Dashboard
    </NavLink>
    <NavLink to="/agent/tickets" onClick={onClick} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
      </svg>
      All Tickets
    </NavLink>
  </>
);

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      {/* ── Top Navigation ── */}
      <header className="topnav">
        <div className="topnav-inner">
          <Logo />

          {/* Desktop links */}
          <nav className="nav-links">
            {user?.role === 'client'
              ? <ClientLinks />
              : <AgentLinks />}
          </nav>

          {/* Desktop right */}
          <div className="nav-right">
            <div className="nav-user">
              <div className="nav-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
              <div className="nav-user-info">
                <div className="nav-user-name">{user?.name}</div>
                <div className="nav-user-role">{user?.role}</div>
              </div>
            </div>
            <button className="btn-logout" onClick={handleLogout}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              Sign out
            </button>
          </div>

          {/* Hamburger */}
          <button
            className="nav-hamburger"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <span style={{ transform: mobileOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
            <span style={{ opacity: mobileOpen ? 0 : 1 }} />
            <span style={{ transform: mobileOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
          </button>
        </div>

        {/* Mobile menu */}
        <div className={`mobile-menu${mobileOpen ? ' open' : ''}`}>
          {user?.role === 'client'
            ? <ClientLinks onClick={() => setMobileOpen(false)} />
            : <AgentLinks onClick={() => setMobileOpen(false)} />}
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="nav-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{user?.name?.charAt(0).toUpperCase()}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role}</div>
              </div>
            </div>
            <button className="btn-logout" onClick={handleLogout}>Sign out</button>
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
