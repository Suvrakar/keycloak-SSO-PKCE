import React, { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, login } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      login(); // Immediately trigger SSO login
    }
  }, [isAuthenticated, isLoading, login]);

  if (isLoading || !isAuthenticated) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute; 