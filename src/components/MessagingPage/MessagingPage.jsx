import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../Auth/Auth';
import api from '../../api/axiosConfig';
import styles from './MessagingPage.module.css';

const MessagingPage = () => {
  const { flatId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  
  const actualFlatId = flatId || searchParams.get('flatId');
  
  const [flat, setFlat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const getUserId = useCallback(() => user?._id || user?.id, [user]);

  // ✅ FIXED: Better ownership detection
  const isOwner = flat && user && (
    getUserId() === (flat.ownerId?._id || flat.ownerId) ||
    (flat.createdBy && Array.isArray(flat.createdBy) && 
     flat.createdBy[0]?._id === getUserId()) ||
    (flat.owner && Array.isArray(flat.owner) && 
     flat.owner[0]?._id === getUserId())
  );

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      const container = document.getElementById('messages-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }, []);

  const markMessagesAsRead = useCallback(async (messageIds) => {
    if (!messageIds?.length) return;
    
    try {
      await api.patch('/api/messages/mark-read', { messageIds });
      setMessages(prev => prev.map(msg => 
        messageIds.includes(msg._id) ? { ...msg, isRead: true } : msg
      ));
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!isLoggedIn || !user || !actualFlatId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        // Fetch flat details
        const flatResponse = await api.get(`/flats/${actualFlatId}`);
        const flatData = flatResponse.data.data || flatResponse.data.flat || flatResponse.data;
        
        
        setFlat(flatData);

        // Fetch messages for this specific flat
        const messagesResponse = await api.get('/api/messages', {
          params: { flatId: actualFlatId }
        });
        
        const messagesData = messagesResponse.data.data || messagesResponse.data || [];
        setMessages(messagesData);

      } catch (err) {
        console.error('❌ Error fetching data:', err);
        setError('Failed to load data: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [actualFlatId, isLoggedIn, user]);

  useEffect(() => {
    if (!user || !actualFlatId || !flat) return;

    const interval = setInterval(async () => {
      try {
        const response = await api.get('/api/messages', {
          params: { flatId: actualFlatId }
        });
        setMessages(response.data.data || []);
      } catch (err) {
        console.error('Error refreshing messages:', err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [actualFlatId, user, flat]);

  const sendMessage = useCallback(async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !flat) return;

    setSending(true);
    setError('');
    
    try {
     
      // Determine receiver based on who is sending
      let receiverId;
      if (isOwner) {
        // Owner is replying - find the other person in the conversation
        const otherMessages = messages.filter(msg => {
          const senderId = msg.senderId?._id || msg.senderId?.id || msg.senderId;
          return senderId?.toString() !== getUserId()?.toString();
        });
        
        if (otherMessages.length > 0) {
          const lastOtherMessage = otherMessages[otherMessages.length - 1];
          receiverId = lastOtherMessage.senderId?._id || lastOtherMessage.senderId?.id || lastOtherMessage.senderId;
        } else {
          setError('No conversation to reply to.');
          setSending(false);
          return;
        }
      } else {
        // Non-owner sending to property owner
        receiverId = flat.ownerId;
      }
      
      const messageData = {
        content: newMessage.trim(),
        flatId: actualFlatId,
        receiverId: receiverId,
        senderId: getUserId()
      };

      const response = await api.post('/api/messages', messageData);
      const newMsg = response.data.data;


      setNewMessage('');
      setMessages(prev => [...prev, newMsg]);
      scrollToBottom();

    } catch (err) {
      console.error('❌ Error sending message:', err);
      const errorMessage = err.response?.data?.message || 'Failed to send message';
      console.error('Full error response:', err.response?.data);
      setError(errorMessage);
    } finally {
      setSending(false);
    }
  }, [newMessage, sending, flat, isOwner, actualFlatId, getUserId, scrollToBottom, messages]);

  useEffect(() => {
    if (!messages.length || !user) return;

    const currentUserId = getUserId();
    const unreadMessages = messages.filter(msg => {
      const receiverId = msg.receiverId?._id || msg.receiverId?.id || msg.receiverId;
      return receiverId?.toString() === currentUserId?.toString() && !msg.isRead;
    });

    if (unreadMessages.length > 0) {
      markMessagesAsRead(unreadMessages.map(msg => msg._id));
    }
  }, [messages, user, getUserId, markMessagesAsRead]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingCard}>
          <div className={styles.spinner}></div>
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <h2>Authentication Required</h2>
          <p>Please log in to view messages</p>
          <button onClick={() => navigate('/login')} className={styles.loginButton}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (error && !flat) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <h2>Error Loading Property</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className={styles.loginButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!flat && !loading) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <h2>Property Not Found</h2>
          <p>The requested property could not be found.</p>
          <button onClick={() => navigate('/')} className={styles.loginButton}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const renderMessage = (message) => {
    const currentUserId = getUserId();
    const isSentByMe = (message.senderId?._id || message.senderId?.id || message.senderId) === currentUserId;
    
    return (
      <div 
        key={message._id} 
        className={`${styles.message} ${isSentByMe ? styles.sent : styles.received}`}
      >
        <div className={styles.messageContent}>
          <p>{message.content}</p>
          <span className={styles.timestamp}>
            {new Date(message.timestamp).toLocaleString()}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Property Messages - {flat?.flatName || flat?.city || 'Property'}</h1>
        <p>
          {isOwner 
            ? 'Messages from interested renters will appear here.'
            : 'Send a message to the property owner.'
          }
        </p>
        {error && <div className={styles.error}>{error}</div>}
      </div>

      <div className={styles.messagesLayout}>
        <div className={styles.conversationsList}>
          <div className={styles.conversationsHeader}>
            <h2>Property Details</h2>
          </div>

          {flat && (
            <div className={styles.conversationItem}>
              <div className={styles.imagePreview}>
                {(() => {
                  const imageSource = flat.image || flat.imageUrl || flat.img || flat.photo || flat.picture;
                  
                  return imageSource ? (
                    <img 
                      src={imageSource} 
                      alt={flat.flatName || flat.city || 'Property'} 
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentNode.innerHTML = '<div class="' + styles.noImage + '">No Image</div>';
                      }}
                    />
                  ) : (
                    <div className={styles.noImage}>No Image Available</div>
                  );
                })()}
              </div>
              
              <div className={styles.propertyInfo}>
                <h3>{flat.flatName || flat.city}</h3>
                <div className={styles.propertyDetails}>
                  <p>{flat.city}, {flat.streetName} {flat.streetNumber}</p>
                  <p>${flat.rentPrice}/month</p>
                  <p>{flat.areaSize} m²</p>
                  <p>Built: {flat.yearBuilt}</p>
                  <p>AC: {flat.hasAC ? 'Yes' : 'No'}</p>
                </div>
              </div>

              <div className={styles.messageCount}>
                {messages.length} message{messages.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>

        <div className={styles.messagesArea}>
          <div className={styles.messagesHeader}>
            <div className={styles.conversationInfo}>
              <h2>{flat?.flatName || 'Property Messages'}</h2>
              <p>
                {isOwner 
                  ? 'Messages about your property'
                  : 'Conversation with property owner'
                }
              </p>
            </div>
          </div>

          <div className={styles.messagesContainer} id="messages-container">
            {messages.length === 0 ? (
              <div className={styles.noMessages}>
                <p>No messages yet for this property.</p>
                {isOwner ? (
                  <p>Messages from interested renters will appear here.</p>
                ) : (
                  <p>Start the conversation by sending a message below!</p>
                )}
              </div>
            ) : (
              messages.map(renderMessage)
            )}
          </div>

          {/* Message Input Form - Show for non-owners OR owners with existing messages */}
          {(!isOwner || (isOwner && messages.length > 0)) && (
            <form onSubmit={sendMessage} className={styles.replyForm}>
              <div className={styles.inputContainer}>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={
                    isOwner 
                      ? "Reply to this conversation..." 
                      : "Type your message..."
                  }
                  className={styles.messageInput}
                  rows={3}
                />
                <button
                  type="submit"
                  className={styles.sendButton}
                  disabled={sending || !newMessage.trim()}
                >
                  {sending ? 'Sending...' : (isOwner ? 'Reply' : 'Send')}
                </button>
              </div>
            </form>
          )}

          {/* Owner Note - Only show when owner has no messages to reply to */}
          {isOwner && messages.length === 0 && (
            <div className={styles.ownerNote}>
              <p>As the property owner, messages from interested renters will appear here. You'll be able to reply once someone contacts you about this property.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagingPage;