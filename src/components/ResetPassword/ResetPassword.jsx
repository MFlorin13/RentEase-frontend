import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import styles from './ResetPassword.module.css';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Preia email-ul din state sau permite introducerea manuală
  const [formData, setFormData] = useState({
    email: location.state?.email || '',
    resetCode: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = cod, 2 = parolă

  useEffect(() => {
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.resetCode) {
      setError('Email and reset code are required');
      return;
    }

    
    if (!/^\d{6}$/.test(formData.resetCode)) {
      setError('Reset code must be 6 digits');
      return;
    }

    setStep(2); 
    setError('');
  };

  const handlePasswordSubmit = async (e) => {
  e.preventDefault();
  
  const { email, resetCode, newPassword, confirmPassword } = formData;
  
  if (!newPassword || !confirmPassword) {
    setError('All password fields are required');
    return;
  }

  if (newPassword !== confirmPassword) {
    setError('Passwords do not match');
    return;
  }

  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;
  if (!passwordRegex.test(newPassword)) {
    setError('Password must be at least 6 characters with uppercase, number, and special character');
    return;
  }

  setLoading(true);
  setError('');
  setMessage('');

  try {
    const requestData = {
      email: email.trim().toLowerCase(),
      resetCode: resetCode.trim(),
      newPassword: newPassword,
      confirmPassword: confirmPassword
    };
    
    const response = await api.post('/users/resetPasswordWithCode', requestData);
    
    setMessage(response.data.message);
    
    setTimeout(() => {
      navigate('/login', { 
        state: { 
          message: 'Password reset successful! Please log in with your new password.' 
        }
      });
    }, 3000);
    
  } catch (err) {
    

    let errorMessage = 'An error occurred. Please try again.';
    let debugInfo = null;
    
    if (err.response && err.response.data) {
    
      if (typeof err.response.data === 'string') {
        errorMessage = err.response.data;
      } else if (err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.response.data.error) {
        errorMessage = err.response.data.error;
      }
      
      debugInfo = err.response.data.debug || err.response.data;
    }
    
    setError(`${errorMessage}${debugInfo ? ' (Check console for details)' : ''}`);
    
    // Dacă codul este invalid, revino la pasul 1
    if (err.response?.status === 400 && errorMessage.includes('Invalid or expired')) {
      setStep(1);
    }
  } finally {
    setLoading(false);
  }
};


  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>
          {step === 1 ? 'Enter Reset Code' : 'Set New Password'}
        </h2>
        <p className={styles.subtitle}>
          {step === 1 
            ? 'Enter the 6-digit code sent to your email address.'
            : 'Enter your new password below.'
          }
        </p>

        {message && (
          <div className={styles.success}>
            {message}
            <br />
            <small>Redirecting to login in 3 seconds...</small>
          </div>
        )}

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        {!message && (
          <>
            {step === 1 ? (
              <form onSubmit={handleCodeSubmit} className={styles.form}>
                <div className={styles.inputGroup}>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Email Address"
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <input
                    type="text"
                    name="resetCode"
                    value={formData.resetCode}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Enter 6-digit code"
                    maxLength="6"
                    pattern="\d{6}"
                    required
                  />
                </div>

                <div className={styles.codeHint}>
                  Check your email for a 6-digit verification code
                </div>

                <button
                  type="submit"
                  className={styles.button}
                >
                  Verify Code
                </button>
              </form>
            ) : (
              <form onSubmit={handlePasswordSubmit} className={styles.form}>
                <div className={styles.inputGroup}>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="New Password"
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Confirm New Password"
                    required
                  />
                </div>

                <div className={styles.passwordHint}>
                  Password must be at least 6 characters with uppercase, number, and special character
                </div>

                <div className={styles.buttonGroup}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className={styles.backButton}
                  >
                    Back to Code
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={styles.button}
                  >
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        <div className={styles.links}>
          <Link to="/login" className={styles.link}>
            Back to Login
          </Link>
          <br />
          <Link to="/forgot-password" className={styles.link}>
            Resend Code
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;