// ProtectedRoute.tsx - New component for route protection
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('worker' | 'employer')[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading, userRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && userRole) {
    const isAllowed = userRole === 'both' || (allowedRoles as string[]).includes(userRole);
    if (!isAllowed) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}