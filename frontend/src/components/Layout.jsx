import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function NavItem({ to, icon, label }) {
  return (
    <NavLink to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
      {icon}
      {label}
    </NavLink>
  );
}

const ClientNav = () => (
  <>
    <div className="nav-section-label">Menu</div>
    <NavItem to="/client/dashboard" label="Dashboard" icon={
      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
      </svg>
    }/>
    <NavItem to="/client/tickets" label="My Tickets" icon={
      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
      </svg>
    }/>
    <NavItem to="/client/tickets/new" label="New Ticket" icon={
      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>
      </svg>
    }/>
  </>
);

const AgentNav = () => (
  <>
    <div className="nav-section-label">Menu</div>
    <NavItem to="/agent/dashboard" label="Dashboard" icon={
      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
      </svg>
    }/>
    <NavItem to="/agent/tickets" label="All Tickets" icon={
      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
      </svg>
    }/>
  </>
);

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-mark">S</div>
          <div>
            <span>Support Desk</span>
            <span className="logo-sub">Ticketing Platform</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {user?.role === 'client' ? <ClientNav /> : <AgentNav />}
        </nav>

        {/* User + logout */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar">{user?.name?.charAt(0).toUpperCase()}</div>
            <div className="info">
              <div className="name">{user?.name}</div>
              <div className="role">
                <span className="status-dot" style={{ marginRight: 5 }} />
                {user?.role}
              </div>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
