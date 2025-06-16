import { useState, useEffect } from 'react';
import { useAuth } from '../Auth/Auth';
import { useNavigate } from 'react-router-dom';
import styles from './UpdateProfile.module.css';
import api from '../../api/axiosConfig';

const UpdateProfile = () => {
  const { user, isLoggedIn, updateUserData } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    birthDate: '',
  });
  
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
  }, [isLoggedIn, navigate]);

  // Load user data into form
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        birthDate: user.birthDate ? user.birthDate.split('T')[0] : '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;
    return passwordRegex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Validate required fields
      if (!formData.firstName || !formData.lastName || !formData.email) {
        setError('Please fill in all required fields');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        return;
      }

      let updateSuccess = false;

      // Handle password update if provided
      if (passwords.newPassword || passwords.confirmPassword) {
        if (!passwords.currentPassword) {
          setError('Current password is required to change password');
          return;
        }

        if (passwords.newPassword !== passwords.confirmPassword) {
          setError('New passwords do not match');
          return;
        }

        if (!validatePassword(passwords.newPassword)) {
          setError('Password must be at least 6 characters, include one uppercase letter, one number, and one special character');
          return;
        }

        try {
          await api.patch(
            '/users/updatePassword',
            {
              oldPassword: passwords.currentPassword,
              newPassword: passwords.newPassword
            },
            { withCredentials: true }
          );

          updateSuccess = true;
        } catch (passwordError) {
          console.error('Password update failed:', passwordError);
          setError(passwordError.response?.data?.message || 'Failed to update password');
          return;
        }
      }

      // Handle profile update
      try {
        const response = await api.patch(
          '/users/updateProfile',
          formData,
          { withCredentials: true }
        );

        // Update the auth context with new user data
        if (updateUserData) {
          updateUserData(response.data.updatedUser || response.data.user || formData);
        }

        updateSuccess = true;

      } catch (profileError) {
        console.error('Profile update failed:', profileError);
        setError(profileError.response?.data?.message || 'Failed to update profile');
        return;
      }

      if (updateSuccess) {
        setSuccess('Profile updated successfully!');
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });

        // Redirect after a brief delay
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }

    } catch (err) {
      console.error('Unexpected error updating profile:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading if user data not loaded yet
  if (!user && isLoggedIn) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingCard}>
          <div className={styles.spinner}></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingCard}>
          <p>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerPattern}></div>
          <h1 className={styles.title}>Update Profile</h1>
          <p className={styles.subtitle}>Keep your information up to date</p>
        </div>

        {/* Form Container */}
        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit} className={styles.form}>
            
            {/* Error/Success Messages */}
            {error && (
              <div className={styles.messageError}>
                <svg className={styles.messageIcon} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {success && (
              <div className={styles.messageSuccess}>
                <svg className={styles.messageIcon} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {success}
              </div>
            )}

            {/* Personal Information Section */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <svg className={styles.sectionIcon} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                Personal Information
              </h2>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  First Name <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={styles.input}
                  required
                  placeholder="Enter your first name"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Last Name <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={styles.input}
                  required
                  placeholder="Enter your last name"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Email <span className={styles.required}>*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={styles.input}
                  required
                  placeholder="Enter your email address"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Birth Date</label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                  className={styles.input}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Change Password Section */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <svg className={styles.sectionIcon} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Change Password
              </h2>
              <p className={styles.sectionDescription}>
                Leave password fields blank if you don't want to change your password
              </p>

              <div className={styles.formGroup}>
                <label className={styles.label}>Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwords.currentPassword}
                  onChange={handlePasswordChange}
                  className={styles.input}
                  placeholder="Enter your current password"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwords.newPassword}
                  onChange={handlePasswordChange}
                  className={styles.input}
                  placeholder="Enter your new password"
                />
                <small className={styles.passwordHint}>
                  Must be at least 6 characters with uppercase, number, and special character
                </small>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwords.confirmPassword}
                  onChange={handlePasswordChange}
                  className={styles.input}
                  placeholder="Confirm your new password"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={styles.button}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className={styles.buttonSpinner}></div>
                  Updating...
                </>
              ) : (
                'Update Profile'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateProfile;