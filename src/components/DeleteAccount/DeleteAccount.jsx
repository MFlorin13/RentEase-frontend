import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth/Auth';
import { useToast } from '../Context/ToastContext/ToastContext';
import api from '../../api/axiosConfig';
import styles from './DeleteAccount.module.css';

const DeleteAccountButton = () => {
  const navigate = useNavigate();
  const { handleLogout } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDeleteAccount = async () => {
    // Double confirmation for account deletion
    const firstConfirm = window.confirm('⚠️ Are you absolutely sure you want to delete your account? This action cannot be undone and will permanently remove all your data.');
    if (!firstConfirm) return;

    const secondConfirm = window.confirm('This is your final warning. Type "DELETE" and click OK to confirm account deletion.');
    if (!secondConfirm) return;

    try {
      setLoading(true);

      // Use the correct API endpoint from your routes
      await api.delete('/users/deleteMe', { 
        withCredentials: true 
      });

      // Log out locally first
      await handleLogout();

      addToast('Account successfully deleted. We\'re sorry to see you go!', 'success');
      
      // Navigate to register page after a brief delay
      setTimeout(() => {
        navigate('/register');
      }, 1000);

    } catch (error) {
      console.error('❌ Error deleting account:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Failed to delete account. Please try again.';
      
      addToast(errorMessage, 'error');

      // If there's a specific error about authentication, redirect to login
      if (error.response?.status === 401) {
        addToast('Please log in again to delete your account', 'error');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.deleteSection}>
      <div className={styles.warningText}>
      </div>
      
      <button 
        className={styles.deleteButton} 
        onClick={handleDeleteAccount}
        disabled={loading}
      >
        {loading ? 'Deleting Account...' : 'Delete My Account'}
      </button>
    </div>
  );
};

export default DeleteAccountButton;