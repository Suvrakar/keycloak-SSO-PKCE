import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const Callback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const handleCallback = async () => {
      try {
        setIsProcessing(true);
        await authService.handleCallback();
        navigate('/dashboard', { replace: true });
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Authentication failed');
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      } finally {
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [navigate]);

  if (isProcessing) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f8f9fa'
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
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <h2 style={{ marginBottom: '10px', color: '#333' }}>
            Processing Authentication
          </h2>
          <p style={{ color: '#666', margin: 0 }}>
            Please wait while we complete your sign-in...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f8f9fa'
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
          <div style={{
            width: '60px',
            height: '60px',
            backgroundColor: '#dc3545',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <span style={{ color: 'white', fontSize: '24px' }}>✕</span>
          </div>
          <h2 style={{ marginBottom: '10px', color: '#333' }}>
            Authentication Failed
          </h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            {error}
          </p>
          <p style={{ color: '#999', fontSize: '14px' }}>
            Redirecting to login page...
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default Callback; 