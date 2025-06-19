import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user, logout, isAuthenticated, refreshUser } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, the user will be redirected
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleRefreshUser = async () => {
    try {
      await refreshUser();
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '30px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '1px solid #e9ecef'
        }}>
          <h1 style={{ margin: 0, color: '#333' }}>
            Dashboard
          </h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleRefreshUser}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                transition: 'background-color 0.3s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#218838';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#28a745';
              }}
            >
              Refresh User
            </button>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                backgroundColor: isLoggingOut ? '#6c757d' : '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: isLoggingOut ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.3s',
                opacity: isLoggingOut ? 0.7 : 1
              }}
              onMouseOver={(e) => {
                if (!isLoggingOut) {
                  e.currentTarget.style.backgroundColor = '#c82333';
                }
              }}
              onMouseOut={(e) => {
                if (!isLoggingOut) {
                  e.currentTarget.style.backgroundColor = '#dc3545';
                }
              }}
            >
              {isLoggingOut ? 'Logging Out...' : 'Logout'}
            </button>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <h3 style={{ marginTop: 0, color: '#495057' }}>User Information</h3>
            {user && (
              <div>
                <p><strong>User ID:</strong> {user.sub}</p>
                <p><strong>Username:</strong> {user.preferred_username}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Name:</strong> {user.name || 'N/A'}</p>
                <p><strong>Given Name:</strong> {user.given_name || 'N/A'}</p>
                <p><strong>Family Name:</strong> {user.family_name || 'N/A'}</p>
                <p><strong>Email Verified:</strong> {user.email_verified ? 'Yes' : 'No'}</p>
              </div>
            )}
          </div>

          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <h3 style={{ marginTop: 0, color: '#495057' }}>Authentication Status</h3>
            <p><strong>Status:</strong> <span style={{ color: '#28a745' }}>Authenticated</span></p>
            <p><strong>Realm:</strong> oneid</p>
            <p><strong>Client:</strong> oneid</p>
            <p><strong>Flow:</strong> OAuth 2.0 Authorization Code with PKCE</p>
          </div>

          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <h3 style={{ marginTop: 0, color: '#495057' }}>Welcome Message</h3>
            <p>Welcome to your dashboard! You have successfully authenticated with Keycloak using OAuth 2.0 with PKCE.</p>
            <p>This is a protected area that only authenticated users can access.</p>
          </div>
        </div>

        <div style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: '#e7f3ff',
          borderRadius: '8px',
          border: '1px solid #b3d9ff'
        }}>
          <h4 style={{ marginTop: 0, color: '#0056b3' }}>OAuth 2.0 with PKCE Implementation</h4>
          <p style={{ margin: '0 0 10px 0', color: '#0056b3' }}>
            Your React application is now successfully integrated with Keycloak using the secure OAuth 2.0 Authorization Code Flow with PKCE (Proof Key for Code Exchange).
          </p>
          <ul style={{ margin: 0, color: '#0056b3', paddingLeft: '20px' }}>
            <li>Secure token exchange using PKCE</li>
            <li>Automatic token refresh</li>
            <li>Proper token validation</li>
            <li>Secure logout with token revocation</li>
            <li>CSRF protection with state parameter</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 