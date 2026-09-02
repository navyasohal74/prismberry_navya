import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ClientDashboard from './pages/client/Dashboard';
import ClientTickets from './pages/client/Tickets';
import ClientNewTicket from './pages/client/NewTicket';
import ClientTicketDetail from './pages/client/TicketDetail';
import AgentDashboard from './pages/agent/Dashboard';
import AgentTickets from './pages/agent/Tickets';
import AgentTicketDetail from './pages/agent/TicketDetail';
import Layout from './components/Layout';
import NotFound from './pages/NotFound';

function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'agent' ? '/agent/dashboard' : '/client/dashboard'} replace />;
  }
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={user ? <Navigate to={user.role === 'agent' ? '/agent/dashboard' : '/client/dashboard'} /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={user.role === 'agent' ? '/agent/dashboard' : '/client/dashboard'} /> : <Register />} />

      {/* Client routes */}
      <Route path="/client" element={<ProtectedRoute allowedRole="client"><Layout /></ProtectedRoute>}>
        <Route path="dashboard" element={<ClientDashboard />} />
        <Route path="tickets" element={<ClientTickets />} />
        <Route path="tickets/new" element={<ClientNewTicket />} />
        <Route path="tickets/:id" element={<ClientTicketDetail />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Agent routes */}
      <Route path="/agent" element={<ProtectedRoute allowedRole="agent"><Layout /></ProtectedRoute>}>
        <Route path="dashboard" element={<AgentDashboard />} />
        <Route path="tickets" element={<AgentTickets />} />
        <Route path="tickets/:id" element={<AgentTicketDetail />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Root redirect */}
      <Route path="/" element={
        user
          ? <Navigate to={user.role === 'agent' ? '/agent/dashboard' : '/client/dashboard'} replace />
          : <Navigate to="/login" replace />
      } />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
