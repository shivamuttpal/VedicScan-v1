import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, hasProfile } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-yellow-500 mx-auto mb-4" />
          <p className="text-xl text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is authenticated but has no profile, redirect to profile
  // unless they are already on the profile page or dashboard
  if (!hasProfile && location.pathname !== '/profile' && location.pathname !== '/dashboard') {
    return <Navigate to="/profile" state={{ enforceProfile: true }} replace />;
  }

  return children;
};

export default ProtectedRoute;
