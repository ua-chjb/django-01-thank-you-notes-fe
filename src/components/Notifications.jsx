import { useState, useEffect, useRef } from 'react';
import { getNotifications, markNotificationRead, deleteNotification, followUser } from '../utils/api';
import { motion, useMotionValue, animate } from 'framer-motion';

function Notifications({ onNavigate, onSelectPost, onNavigateToUserProfile }) {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followingStates, setFollowingStates] = useState({});

  useEffect(() => {
    loadNotifications();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await getNotifications();
      const notificationsList = data.notifications || [];
      setNotifications(data.notifications || []);
      const initialFollowStates = {};
      notificationsList.forEach(notif => {
        if (notif.notification_type === 'follow' && notif.sender.is_following) {
          initialFollowStates[notif.sender.id] = true;
        }
      });
      setFollowingStates(initialFollowStates);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read
    try {
      await markNotificationRead(notification.id);
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }

    // Navigate based on type
    if (notification.notification_type === 'follow') {
      onNavigateToUserProfile(notification.sender.username);
    } else {
      // like_post, comment, like_comment - all have posts
      if (notification.post) {
        const postForNavigation = {
          id: notification.post,
          what: notification.post_preview?.what || 'Post'
        };
        onSelectPost(postForNavigation);
      }
    }
  };

  const handleFollow = async (e, notification) => {
    e.stopPropagation();
    try {
      await followUser(notification.sender.username);
      setFollowingStates(prev => ({ ...prev, [notification.sender.id]: true }));
    } catch (err) {
      console.error('Error following user:', err);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const getNotificationText = (notification) => {
    const senderName = notification.sender.first_name || notification.sender.username;
    const postTitle = notification.post_preview?.what || 'a post';
    
    switch (notification.notification_type) {
      case 'like_post':
        return `${senderName} liked your post ${postTitle}.`;
      case 'comment':
        return `${senderName} commented on your post ${postTitle}.`;
      case 'like_comment':
        return `${senderName} liked your comment on the post ${postTitle}.`;
      case 'follow':
        return `${senderName} started following you.`;
      default:
        return '';
    }
  };

  const getTimestamp = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center pb-24">
        <div className="text-gray-500">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <svg 
            width="64" 
            height="64" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#D1D5DB" 
            strokeWidth="2"
            className="mb-4"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <p className="text-gray-500 text-base">No new notifications</p>
        </div>
      ) : (
        <div className="bg-white divide-y divide-gray-100">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onNotificationClick={handleNotificationClick}
              onFollow={handleFollow}
              onDelete={handleDeleteNotification}
              isFollowing={followingStates[notification.sender.id]}
              getNotificationText={getNotificationText}
              getTimestamp={getTimestamp}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationItem({ 
  notification, 
  onNotificationClick, 
  onFollow, 
  onDelete,
  isFollowing,
  getNotificationText,
  getTimestamp
}) {
  const containerRef = useRef(null);
  const x = useMotionValue(0);
  const DELETE_BUTTON_WIDTH = 120;
  const SWIPE_THRESHOLD = 30;

  const handleDragEnd = (event, info) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset < -SWIPE_THRESHOLD || velocity < -500) {
      animate(x, -DELETE_BUTTON_WIDTH, { type: 'spring', stiffness: 400, damping: 30 });
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
    }
  };

  const handleItemClick = () => {
    const currentX = x.get();
    if (currentX < -10) {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
    } else {
      onNotificationClick(notification);
    }
  };

  const handleDeleteClick = () => {
    onDelete(notification.id);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [x]);

  // Get post image if it exists (would need to be added to serializer)
  // For now, we'll use post_preview which doesn't have image
  const postImage = null; // TODO: Backend needs to include gift_image in response

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* Delete Button Background */}
      <div 
        className="absolute inset-0 bg-red-600 flex items-center justify-end pr-6 rounded-xl"
        style={{
          borderTop: '1px solid white',
          borderBottom: '1px solid white',
          borderLeft: '1px solid white',
          borderRight: '2px solid white'
        }}
      >
        <button
          onClick={handleDeleteClick}
          className="text-white font-bold text-base px-4 py-2 active:opacity-70 transition-opacity"
        >
          Delete
        </button>
      </div>

      {/* Notification Content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -DELETE_BUTTON_WIDTH, right: 0 }}
        dragElastic={0.1}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{ x }}
        onClick={handleItemClick}
        className={`relative p-4 cursor-pointer select-none ${
          !notification.is_read ? 'bg-blue-50' : 'bg-white'
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Profile Picture */}
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
            {notification.sender.profile_picture ? (
              <img 
                src={notification.sender.profile_picture.startsWith('http') 
                  ? notification.sender.profile_picture 
                  : `${API_URL}${notification.sender.profile_picture}`
                }
                alt={notification.sender.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 font-semibold">
                {notification.sender.username.charAt(0).toUpperCase()}
              </div>
            )}           
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">
              {getNotificationText(notification)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {getTimestamp(notification.created_at)}
            </p>
          </div>

          {/* Right Component */}
          <div className="flex-shrink-0">
            {notification.notification_type === 'follow' ? (
              <button
                onClick={(e) => onFollow(e, notification)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                  isFollowing 
                    ? 'bg-gray-200'
                    : 'relative overflow-hidden'
                }`}
                style={isFollowing ? { color: '#0084FF' } : {}}
              >
                {!isFollowing && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-christmas-light to-christmas-dark" />
                    <div className="absolute inset-0 bg-white/20 backdrop-blur-sm" />
                  </>
                )}
                <span className={`relative z-10 ${isFollowing ? '' : 'text-white'}`}>
                  {isFollowing ? 'Following' : 'Follow Back'}
                </span>
              </button>
            ) : (
              postImage && (
                <div className="w-12 h-12 rounded overflow-hidden bg-gray-100">
                  <img 
                    src={postImage.startsWith('http') 
                      ? postImage 
                      : `https://thankyounotes.today/${postImage}`
                    }
                    alt="Post"
                    className="w-full h-full object-cover"
                  />
                </div>
              )
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Notifications;