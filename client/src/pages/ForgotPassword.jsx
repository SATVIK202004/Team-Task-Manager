import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function ForgotPassword() {
  const [step, setStep] = useState('email'); // 'email' | 'reset'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Step 1: Request OTP
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setInfo(res.data.message);
      setStep('reset');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset code');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify OTP & set new password
  const handleReset = async (e) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/reset-password', { email, otp, newPassword });
      setInfo(res.data.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError('');
    try {
      const res = await api.post('/auth/resend-otp', { email, purpose: 'reset' });
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
              {step === 'email' ? 'Reset your password' : 'Set a new password'}
            </p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {info && !error && <div className="alert alert-info">{info}</div>}

          {step === 'email' ? (
            <form onSubmit={handleRequestOTP} className="auth-form">
              <p className="otp-hint">Enter your email and we'll send a code to reset your password.</p>
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
              <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="auth-form">
              <p className="otp-hint">Enter the code sent to <strong>{email}</strong> and your new password.</p>
              <div className="form-group">
                <label htmlFor="otp">Verification Code</label>
                <input
                  id="otp"
                  type="text"
                  placeholder="6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  autoFocus
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  placeholder="Min. 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmNewPassword">Confirm New Password</label>
                <input
                  id="confirmNewPassword"
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
                {isSubmitting ? 'Resetting...' : 'Reset Password'}
              </button>
              <p className="resend-text">
                Didn't receive it?{' '}
                <button type="button" className="link-btn" onClick={handleResend}>Resend code</button>
              </p>
            </form>
          )}

          <p className="auth-footer">
            Remember your password?{' '}
            <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
