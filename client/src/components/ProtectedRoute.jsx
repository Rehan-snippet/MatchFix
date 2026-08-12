import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="page-center">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && !user.roles?.includes(role)) {
    return (
      <div className="page-center">
        <p>
          This page needs the <strong>{role}</strong> role on your account.
        </p>
        <a href="/profile">Go to your profile to add it</a>
      </div>
    );
  }
  return children;
}
