// Register.jsx - Add the same authentication protection

import React, { useState, useEffect } from 'react'; // ✅ Add useEffect
import { useNavigate, Link } from 'react-router-dom';
import styles from './Register.module.css'; // Assuming similar styles
import api from '../../api/axiosConfig';
import { useAuth } from '../Auth/Auth'; // ✅ Add useAuth

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthDate: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { isLoggedIn, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && isLoggedIn) {
      navigate('/', { replace: true });
    }
  }, [isLoggedIn, authLoading, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || 
        !formData.password || !formData.confirmPassword || !formData.birthDate) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      const registrationData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        birthDate: formData.birthDate
      };

      const res = await api.post('/users/register', registrationData);

      if (res.status === 201) {
        // Redirect to login after successful registration
        navigate('/login', { 
          replace: true,
          state: { message: 'Registration successful! Please log in.' }
        });
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (isLoggedIn) {
    return null; // Component will redirect via useEffect
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h2 className={styles.title}>Register</h2>
        {error && <div className={styles.error}>{error}</div>}
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              name="firstName"
              className={styles.input}
              placeholder=" "
              value={formData.firstName}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
            <label className={styles.label}>First Name</label>
          </div>
          
          <div className={styles.inputGroup}>
            <input
              type="text"
              name="lastName"
              className={styles.input}
              placeholder=" "
              value={formData.lastName}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
            <label className={styles.label}>Last Name</label>
          </div>

          <div className={styles.inputGroup}>
            <input
              type="email"
              name="email"
              className={styles.input}
              placeholder=" "
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
            <label className={styles.label}>Email</label>
          </div>

          <div className={styles.inputGroup}>
            <input
              type="date"
              name="birthDate"
              className={styles.input}
              value={formData.birthDate}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
            <label className={styles.label}>Birth Date</label>
          </div>

          <div className={styles.inputGroup}>
            <input
              type="password"
              name="password"
              className={styles.input}
              placeholder=" "
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
            <label className={styles.label}>Password</label>
          </div>

          <div className={styles.inputGroup}>
            <input
              type="password"
              name="confirmPassword"
              className={styles.input}
              placeholder=" "
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
            <label className={styles.label}>Confirm Password</label>
          </div>

          <button
            type="submit"
            className={styles.button}
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Register'}
          </button>
          
          <div className={styles.loginLink}>
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;