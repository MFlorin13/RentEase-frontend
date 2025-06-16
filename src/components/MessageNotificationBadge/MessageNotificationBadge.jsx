import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth/Auth';
import api from '../../api/axiosConfig';
import styles from './MessageNotificationBadge.module.css';

const MessageNotificationBadge = ({ flat, showForOwner = false, showForClient = false }) => {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Check if current user is the owner of this flat
  const isOwner = flat && user && (
    (flat.ownerId?._id || flat.ownerId) === (user._id || user.id) ||
    (flat.createdBy && Array.isArray(flat.createdBy) && flat.createdBy[0]?._id === (user._id || user.id)) ||
    (flat.owner && Array.isArray(flat.owner) && flat.owner[0]?._id === (user._id || user.id))
  );

  // Determine if we should show the badge
  const shouldShowBadge = (
    (showForOwner && isOwner) || 
    (showForClient && !isOwner)
  ) && isLoggedIn && user;

  // Handle badge click to navigate to messages
  const handleBadgeClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isOwner && showForOwner) {
      // Owner clicking on their property - go to owner messages
      navigate(`/owner-messages?flatId=${flat._id}`);
    } else if (!isOwner && showForClient) {
      // Client clicking on a property they've messaged about
      navigate(`/flat/${flat._id}/messages`);
    } else {
      // Fallback - general messages page
      navigate(`/messages/${flat._id}`);
    }
  };

  useEffect(() => {
    if (!shouldShowBadge) {
      setUnreadCount(0);
      return;
    }

    const fetchUnreadMessages = async () => {
      try {
        setLoading(true);
        
        // Fetch all messages for this flat
        const response = await api.get('/api/messages', {
          params: { flatId: flat._id }
        });

        const messages = response.data.data || [];
        
        // Count unread messages where current user is the receiver
        const currentUserId = user._id || user.id;
        const unread = messages.filter(message => {
          const receiverId = message.receiverId?._id || message.receiverId?.id || message.receiverId;
          return receiverId?.toString() === currentUserId?.toString() && !message.isRead;
        });

        setUnreadCount(unread.length);
        
      } catch (error) {
        console.error('Error fetching unread messages:', error);
        setUnreadCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchUnreadMessages();

    // Poll for new messages every 30 seconds
    const interval = setInterval(fetchUnreadMessages, 30000);

    return () => clearInterval(interval);
  }, [flat._id, user, shouldShowBadge]);

  // Don't render anything if we shouldn't show the badge or no unread messages
  if (!shouldShowBadge || unreadCount === 0 || loading) {
    return null;
  }

  return (
    <div 
      className={styles.notificationBadge} 
      title={`${unreadCount} unread message${unreadCount !== 1 ? 's' : ''} - Click to view`}
      onClick={handleBadgeClick}
      style={{ cursor: 'pointer' }}
    >
      <div className={styles.messageIcon}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
        </svg>
      </div>
      <div className={styles.badge}>
        {unreadCount > 99 ? '99+' : unreadCount}
      </div>
      <div className={styles.pulseAnimation}></div>
    </div>
  );
};

export default MessageNotificationBadge;