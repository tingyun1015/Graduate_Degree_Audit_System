import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export function ProtectedStudentRoute() {
  const { isLoggedIn, role } = useAuthStore();
  if (!isLoggedIn || role !== 'student') {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

export function ProtectedAdminRoute() {
  const { isLoggedIn, role } = useAuthStore();
  if (!isLoggedIn || role !== 'admin') {
    return <Navigate to="/admin" replace />;
  }
  return <Outlet />;
}
