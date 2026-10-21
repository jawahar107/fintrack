// src/components/ProtectedRoute.jsx
// Guards routes that require login.
// If user is not authenticated → redirect to /login.
// If they ARE authenticated → render the child page.

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  // Outlet renders whatever child route matched (e.g. <Dashboard />)
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

