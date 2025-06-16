import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth/Auth';
import { FaEnvelope, FaUser, FaEye } from 'react-icons/fa';
import styles from './MessageButton.module.css';

const MessageButton = ({ flat, className = '' }) => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();

  const handleMessageClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    // Check if user is trying to message themselves
    if (user._id === flat.ownerId || user.id === flat.ownerId) {
      // Navigate to owner messages instead of showing alert
      navigate(`/owner-messages?flatId=${flat._id}`);
      return;
    }

    // Navigate to the messaging page for non-owners
    navigate(`/flat/${flat._id}/messages`);
  };

  const handleLoginClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/login');
  };

  // Check if current user is the owner
  const isOwner = isLoggedIn && user && (user._id === flat.ownerId || user.id === flat.ownerId);

  if (!isLoggedIn) {
    // Show login button for non-logged users
    return (
      <button 
        onClick={handleLoginClick}
        className={`${styles.loginButton} ${className}`}
        title="Login to contact property owner"
      >
        <FaUser className={styles.icon} />
        Login to Contact
      </button>
    );
  }

  if (isOwner) {
    // Show "View Messages" button for owners
    return (
      <button 
        onClick={handleMessageClick}
        className={`${styles.ownerButton} ${className}`}
        title="View messages about your property"
      >
        <FaEye className={styles.icon} />
        View Messages
      </button>
    );
  }

  // Show normal message button for non-owners who are logged in
  return (
    <button 
      onClick={handleMessageClick}
      className={`${styles.messageButton} ${className}`}
      title="Send message to property owner"
    >
      <FaEnvelope className={styles.icon} />
      Send Messages
    </button>
  );
};

export default MessageButton;