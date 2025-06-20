import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const { isAuthenticated, login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      setError(null);
      await login();
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (isLoading) {
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

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f5f5f5',
      gap: '30px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h1 style={{ marginBottom: '20px', color: '#333' }}>
          Welcome to My App
        </h1>
        <p style={{ marginBottom: '30px', color: '#666' }}>
          Please sign in to continue
        </p>
        
        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}
        
        <button
          onClick={handleLogin}
          disabled={isLoggingIn}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: isLoggingIn ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isLoggingIn ? 'not-allowed' : 'pointer',
            width: '100%',
            transition: 'background-color 0.3s',
            opacity: isLoggingIn ? 0.7 : 1
          }}
          onMouseOver={(e) => {
            if (!isLoggingIn) {
              e.currentTarget.style.backgroundColor = '#0056b3';
            }
          }}
          onMouseOut={(e) => {
            if (!isLoggingIn) {
              e.currentTarget.style.backgroundColor = '#007bff';
            }
          }}
        >
          {isLoggingIn ? 'Signing In...' : 'Sign In with ONEID'}
        </button>
        
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#e7f3ff',
          borderRadius: '5px',
          border: '1px solid #b3d9ff'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#0056b3', fontSize: '14px' }}>
            OAuth 2.0 with PKCE
          </h4>
          <p style={{ margin: 0, color: '#0056b3', fontSize: '12px', lineHeight: '1.4' }}>
            This application uses the secure OAuth 2.0 Authorization Code Flow with PKCE (Proof Key for Code Exchange) for authentication.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 