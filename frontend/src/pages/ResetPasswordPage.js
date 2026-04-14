import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid reset link. Please request a new one.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setMessage('Password must be at least 8 characters.');
      setStatus('error');
      return;
    }
    if (password !== confirm) {
      setMessage('Passwords do not match.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setMessage('');
    try {
      await axios.post(`${API_URL}/auth/reset-password`, {
        token,
        new_password: password
      });
      setStatus('success');
      setMessage('Password reset successfully!');
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.detail || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#f9fafb',
      fontFamily: 'Arial, sans-serif', padding: '20px'
    }}>
      <div style={{
        background: '#fff', padding: '40px', borderRadius: '16px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        width: '100%', maxWidth: '420px'
      }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-block', background: '#1a56db',
            borderRadius: '10px', padding: '10px 22px', marginBottom: '20px'
          }}>
            <span style={{ color: 'white', fontSize: '20px', fontWeight: '700' }}>JioGen AI</span>
          </div>
          <h2 style={{ color: '#111827', fontSize: '22px', margin: '0 0 8px', fontWeight: '700' }}>
            Set New Password
          </h2>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
            Enter your new password below
          </p>
        </div>

        {status === 'success' ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '52px', marginBottom: '16px' }}>✅</div>
            <p style={{ color: '#059669', fontWeight: '700', fontSize: '18px', marginBottom: '8px' }}>
              Password Reset Successfully!
            </p>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              Redirecting to login in 3 seconds...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '18px' }}>
              <label style={{
                display: 'block', color: '#374151', fontSize: '14px',
                fontWeight: '600', marginBottom: '6px'
              }}>
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                required
                style={{
                  width: '100%', padding: '11px 14px', border: '1.5px solid #d1d5db',
                  borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box',
                  outline: 'none', transition: 'border 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = '#1a56db'}
                onBlur={e => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            <div style={{ marginBottom: '22px' }}>
              <label style={{
                display: 'block', color: '#374151', fontSize: '14px',
                fontWeight: '600', marginBottom: '6px'
              }}>
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter new password"
                required
                style={{
                  width: '100%', padding: '11px 14px', border: '1.5px solid #d1d5db',
                  borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box',
                  outline: 'none', transition: 'border 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = '#1a56db'}
                onBlur={e => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            {status === 'error' && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: '8px', padding: '11px 14px',
                marginBottom: '18px', color: '#dc2626', fontSize: '14px'
              }}>
                ⚠️ {message}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              style={{
                width: '100%', padding: '13px',
                background: status === 'loading' ? '#93c5fd' : '#1a56db',
                color: 'white', border: 'none', borderRadius: '8px',
                fontSize: '16px', fontWeight: '700',
                cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s'
              }}
            >
              {status === 'loading' ? 'Resetting...' : 'Reset Password'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Link to="/" style={{ color: '#1a56db', fontSize: '14px', textDecoration: 'none' }}>
                ← Back to Login
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
