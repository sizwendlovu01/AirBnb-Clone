import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Spinner from './Spinner.jsx';

export default function HostRoute({ children }) {
  const { user, loading, isHost } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (!isHost) {
    return <Navigate to="/" replace />;
  }

  return children;
}
