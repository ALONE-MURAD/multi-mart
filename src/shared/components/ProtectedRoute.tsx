import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
  requireApprovedSeller?: boolean;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
  requireApprovedSeller = false,
  requireAdmin = false,
}) => {
  const { firebaseUser, isApprovedSeller, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[55vh] flex items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (!firebaseUser) return <>{fallback}</>;
  if (requireAdmin && !isAdmin) return <>{fallback}</>;
  if (requireApprovedSeller && !isApprovedSeller) return <>{fallback}</>;

  return <>{children}</>;
};
