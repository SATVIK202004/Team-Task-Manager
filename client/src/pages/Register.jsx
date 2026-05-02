import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Register() {
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'member'
  });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Step 1: Submit registration form
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    const { name, email, password, confirmPassword, role } = formData;

    if (!name || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/register', { name, email, password, role });
      setInfo(res.data.message);
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
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
      const res = await api.post('/auth/verify-register', { email: formData.email, otp });
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
      const res = await api.post('/auth/resend-otp', { email: formData.email, purpose: 'register' });
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
              {step === 'form' ? 'Create your account' : 'Verify your email'}
            </p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {info && !error && <div className="alert alert-info">{info}</div>}

          {step === 'form' ? (
            <form onSubmit={handleRegister} className="auth-form">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input id="name" name="name" type="text" placeholder="John Doe" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email address</label>
                <input id="email" name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input id="password" name="password" type="password" placeholder="Min. 6 characters" value={formData.password} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input id="confirmPassword" name="confirmPassword" type="password" placeholder="Re-enter password" value={formData.confirmPassword} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="role">Account Role</label>
                <select id="role" name="role" value={formData.role} onChange={handleChange}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOTPVerify} className="auth-form">
              <p className="otp-hint">We sent a 6-digit code to <strong>{formData.email}</strong></p>
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
                {isSubmitting ? 'Verifying...' : 'Verify & Continue'}
              </button>
              <p className="resend-text">
                Didn't receive it?{' '}
                <button type="button" className="link-btn" onClick={handleResend}>Resend code</button>
              </p>
            </form>
          )}

          <p className="auth-footer">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
