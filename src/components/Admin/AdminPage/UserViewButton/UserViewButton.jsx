import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Eye } from 'lucide-react';
import { useToast } from '../../../Context/ToastContext/ToastContext';
import api from '../../../../api/axiosConfig';
import styles from './UserViewButton.module.css';

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className={styles.modalRoot}>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.modalContainer}>
        {children}
      </div>
    </div>,
    document.body
  );
};

const UserViewButton = ({ user, userFlats, onUserUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  
  // Initialize with user prop and update when user prop changes
  const [editableUser, setEditableUser] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    birthDate: user.birthDate ? user.birthDate.split('T')[0] : '',
  });

  // Update editableUser when user prop changes (from parent updates)
  useEffect(() => {
    setEditableUser({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      birthDate: user.birthDate ? user.birthDate.split('T')[0] : '',
    });
  }, [user.firstName, user.lastName, user.email, user.birthDate]);

  const handleViewClick = (e) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    // Reset to current user data
    setEditableUser({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      birthDate: user.birthDate ? user.birthDate.split('T')[0] : '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditableUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (!editableUser.firstName || !editableUser.lastName || !editableUser.email) {
      addToast('Please fill in all required fields', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editableUser.email)) {
      addToast('Please enter a valid email address', 'error');
      return;
    }

    try {
      setLoading(true);
      console.log('Updating user:', user._id, editableUser);

      const response = await api.patch(
        `/users/editUser/${user._id}`,
        editableUser,
        { withCredentials: true }
      );

      console.log('Update response:', response.data);

      // Create the updated user object
      const updatedUser = {
        ...user,
        ...editableUser,
        // Preserve any fields that shouldn't be overwritten
        _id: user._id,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
      };

      console.log('Sending updated user to parent:', updatedUser);

      // Update parent component
      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }

      setIsEditing(false);
      addToast('User information updated successfully', 'success');

    } catch (error) {
      console.error('Error updating user:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Failed to update user information';
      addToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return 'N/A';
    
    try {
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    } catch {
      return 'N/A';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  return (
    <>
      <button onClick={handleViewClick} className={styles.viewButton}>
        <Eye size={18} />
        View Profile
      </button>

      <Modal isOpen={isModalOpen} onClose={handleClose}>
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>User Profile</h2>
            <div className={styles.headerButtons}>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className={styles.editButton}
                >
                  Edit
                </button>
              )}
              <button onClick={handleClose} className={styles.closeButton}>
                ×
              </button>
            </div>
          </div>

          <div className={styles.userInfo}>
            <div className={styles.infoSection}>
              <h3 className={styles.sectionTitle}>Personal Information</h3>
              <div className={styles.infoGrid}>
                {isEditing ? (
                  <>
                    <div className={styles.infoCard}>
                      <label className={styles.infoLabel}>First Name *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={editableUser.firstName}
                        onChange={handleInputChange}
                        className={styles.editInput}
                        required
                      />
                    </div>
                    <div className={styles.infoCard}>
                      <label className={styles.infoLabel}>Last Name *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={editableUser.lastName}
                        onChange={handleInputChange}
                        className={styles.editInput}
                        required
                      />
                    </div>
                    <div className={styles.infoCard}>
                      <label className={styles.infoLabel}>Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={editableUser.email}
                        onChange={handleInputChange}
                        className={styles.editInput}
                        required
                      />
                    </div>
                    <div className={styles.infoCard}>
                      <label className={styles.infoLabel}>Birth Date</label>
                      <input
                        type="date"
                        name="birthDate"
                        value={editableUser.birthDate}
                        onChange={handleInputChange}
                        className={styles.editInput}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.infoCard}>
                      <div className={styles.infoLabel}>Full Name</div>
                      <div className={styles.infoValue}>
                        {user.firstName || 'N/A'} {user.lastName || 'N/A'}
                      </div>
                    </div>
                    <div className={styles.infoCard}>
                      <div className={styles.infoLabel}>Email</div>
                      <div className={styles.infoValue}>{user.email || 'N/A'}</div>
                    </div>
                    <div className={styles.infoCard}>
                      <div className={styles.infoLabel}>Age</div>
                      <div className={styles.infoValue}>
                        {calculateAge(user.birthDate)} {calculateAge(user.birthDate) !== 'N/A' ? 'years' : ''}
                      </div>
                    </div>
                    <div className={styles.infoCard}>
                      <div className={styles.infoLabel}>Birth Date</div>
                      <div className={styles.infoValue}>
                        {formatDate(user.birthDate)}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className={styles.infoSection}>
              <h3 className={styles.sectionTitle}>Account Information</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoCard}>
                  <div className={styles.infoLabel}>Account Type</div>
                  <div className={styles.infoValue}>
                    <span className={user.isAdmin ? styles.adminBadge : styles.userBadge}>
                      {user.isAdmin ? 'Admin' : 'Regular User'}
                    </span>
                  </div>
                </div>
                <div className={styles.infoCard}>
                  <div className={styles.infoLabel}>Number of Flats</div>
                  <div className={styles.infoValue}>
                    {userFlats[user._id?.toString()] || 0}
                  </div>
                </div>
                <div className={styles.infoCard}>
                  <div className={styles.infoLabel}>Account Created</div>
                  <div className={styles.infoValue}>
                    {formatDate(user.created)}
                  </div>
                </div>
                <div className={styles.infoCard}>
                  <div className={styles.infoLabel}>User ID</div>
                  <div className={styles.infoValue}>
                    {user._id || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            {isEditing ? (
              <div className={styles.editActions}>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className={styles.saveButton}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditableUser({
                      firstName: user.firstName || '',
                      lastName: user.lastName || '',
                      email: user.email || '',
                      birthDate: user.birthDate ? user.birthDate.split('T')[0] : '',
                    });
                  }}
                  disabled={loading}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button onClick={handleClose} className={styles.closeModalButton}>
                Close
              </button>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default UserViewButton;