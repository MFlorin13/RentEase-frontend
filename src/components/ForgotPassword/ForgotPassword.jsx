import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import styles from './ForgotPassword.module.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email is required');
      return;
    }

    // Validare format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      
      const response = await api.post('/users/forgotPassword', { 
        email: email.trim().toLowerCase() 
      });
      
      setMessage(response.data.message);
      setCodeSent(true);
      
      // Redirect către pagina de introducere a codului după 2 secunde
      setTimeout(() => {
        navigate('/reset-password-code', { 
          state: { email: email.trim().toLowerCase() }
        });
      }, 2000);
      
    } catch (err) {
      console.error('❌ Forgot password error:', err);
      const errorMessage = err.response?.data?.message || 'An error occurred. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Forgot Password</h2>
        <p className={styles.subtitle}>
          Enter your email address and we'll send you a verification code to reset your password.
        </p>

        {message && (
          <div className={styles.success}>
            {message}
            {codeSent && (
              <>
                <br />
                <small>Redirecting to code verification in 2 seconds...</small>
              </>
            )}
          </div>
        )}

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        {!codeSent && (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                placeholder="Enter your email address"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={styles.button}
            >
              {loading ? 'Sending Code...' : 'Send Reset Code'}
            </button>
          </form>
        )}

        <div className={styles.links}>
          <Link to="/login" className={styles.link}>
            Back to Login
          </Link>
          {codeSent && (
            <>
              <br />
              <Link to="/reset-password-code" className={styles.link}>
                Go to Code Verification
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;