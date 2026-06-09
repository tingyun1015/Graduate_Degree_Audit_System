import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import StudentLayout from './StudentLayout';
import AdminLayout from './AdminLayout';

export function ProtectedStudentRoute() {
  const { isLoggedIn, role } = useAuthStore();
  if (!isLoggedIn || role !== 'student') {
    return <Navigate to="/" replace />;
  }
  return <StudentLayout />;
}

export function ProtectedAdminRoute() {
  const { isLoggedIn, role } = useAuthStore();
  if (!isLoggedIn || role !== 'admin') {
    return <Navigate to="/admin" replace />;
  }
  return <AdminLayout />;
}
