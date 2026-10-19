import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ role, children }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && user?.role !== role) {
    // Redirect to the user's appropriate home dashboard
    const destination = user?.role === 'admin' ? '/admin' : '/dashboard';
    return <Navigate to={destination} replace />;
  }

  return children;
};

export default ProtectedRoute;
