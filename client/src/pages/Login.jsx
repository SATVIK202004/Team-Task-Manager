import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Login() {
  const [step, setStep] = useState('credentials'); // 'credentials' | 'otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();

  // Step 1: Submit credentials
  const handleCredentials = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      setInfo(res.data.message);
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify OTP
  const handleOTPVerify = async (e) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/verify-login', { email, otp });
      loginWithToken(res.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError('');
    try {
      const res = await api.post('/auth/resend-otp', { email, purpose: 'login' });
      setInfo(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-logo">TaskFlow</h1>
            <p className="auth-subtitle">
              {step === 'credentials' ? 'Sign in to your account' : 'Enter verification code'}
            </p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {info && !error && <div className="alert alert-info">{info}</div>}

          {step === 'credentials' ? (
            <form onSubmit={handleCredentials} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>
              <div className="auth-links">
                <Link to="/forgot-password" className="auth-link">Forgot password?</Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleOTPVerify} className="auth-form">
              <p className="otp-hint">We sent a 6-digit code to <strong>{email}</strong></p>
              <div className="form-group">
                <label htmlFor="otp">Verification Code</label>
                <input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  autoFocus
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
                {isSubmitting ? 'Verifying...' : 'Verify & Sign In'}
              </button>
              <p className="resend-text">
                Didn't receive it?{' '}
                <button type="button" className="link-btn" onClick={handleResend}>Resend code</button>
              </p>
            </form>
          )}

          <p className="auth-footer">
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
