import { useRef, useState } from 'react';
import { CheckIcon, ArrowIcon, CircleIcon, UserIcon, GiftIcon } from './Icons';
import { API_URL, S3_BASE_URL } from '../utils/api';
import { correctImageOrientation } from '../utils/imageUtils';

function Profile({ posts, currentUser, onLogout, onNavigate, onSelectPost, onUserUpdate, onNavigateToUserProfile }) {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  // Safety check
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Filter to show only current user's posts
  const userPosts = posts.filter(post => post.author.id === currentUser.id);

  // Calculate progress with weighted scoring
  const completionPercent = userPosts.length === 0 
    ? 0 
    : Math.round(
      userPosts.reduce((total, post) => {
        if (post.status === 'sent') return total + 100;
        if (post.status === 'drafted') return total + 80;
        return total + 0; // not_started
      }, 0) / userPosts.length
    );

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const correctedFile = await correctImageOrientation(file);

      const formData = new FormData();
      formData.append('profile_picture', file);

      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/update_user/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      // Refresh user data across entire app
      await onUserUpdate();
      
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      alert('Failed to upload profile picture');
    } finally {
      setIsUploading(false);
    }
  };

  const loadFollowers = async () => {
    setFollowersLoading(true);
    try {
      const response = await fetch(`${API_URL}/users/${currentUser.username}/followers/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      const data = await response.json();
      setFollowers(data.followers || data);
    } catch (err) {
      console.error('Error loading followers:', err);
    } finally {
      setFollowersLoading(false);
    }
  };

  const loadFollowing = async () => {
    setFollowingLoading(true);
    try {
      const response = await fetch(`${API_URL}/users/${currentUser.username}/following/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      const data = await response.json();
      setFollowing(data.following || data);
    } catch (err) {
      console.error('Error loading following:', err);
    } finally {
      setFollowingLoading(false);
    }
  };

  const handleNavigateToUser = (username) => {
    onNavigateToUserProfile(username);
  };

  // Get profile picture URL from currentUser prop
  const profilePicture = currentUser?.profile_picture 
    ? (currentUser.profile_picture.startsWith('http') 
      ? currentUser.profile_picture 
      : `${S3_BASE_URL}${currentUser.profile_picture}`)
    : null;

  return (
    <div className="min-h-screen bg-gray-100 pb-24 flex flex-col">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-br from-christmas-light to-christmas-dark px-5 py-12 sm:py-16 relative flex-shrink-0">
        <button 
          onClick={onLogout}
          className="absolute top-5 right-5 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold text-white hover:bg-white/30 transition"
        >
          Logout
        </button>

        <div className="text-center max-w-md mx-auto">
          {/* Profile Picture - CLICKABLE */}
          <div 
            onClick={handleProfilePictureClick}
            className="w-20 h-20 sm:w-24 sm:h-24 bg-white/90 rounded-full mx-auto mb-4 flex items-center justify-center shadow-xl cursor-pointer hover:bg-white transition overflow-hidden relative"
          >
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs">
                Uploading...
              </div>
            )}
            {profilePicture ? (
              <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <UserIcon size={40} color="#6B7280" />
            )}
          </div>
          <input 
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
          
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 drop-shadow-sm">
            {currentUser.first_name || 'User'}
          </h2>
          <p className="text-white/90 text-sm sm:text-base mb-4">
            @{currentUser.username || 'username'}
          </p>

          {/* Stats */}
          <div className="flex gap-6 mb-4 justify-center">
            <button 
              onClick={() => {
                setShowFollowersModal(true);
                loadFollowers();
              }}
              className="text-center hover:opacity-70 transition"
            >
              <div className="text-xl font-bold text-white">
                {currentUser.followers_count || 0}
              </div>
              <div className="text-sm text-white/90">Followers</div>
            </button>
            <button 
              onClick={() => {
                setShowFollowingModal(true);
                loadFollowing();
              }}
              className="text-center hover:opacity-70 transition"
            >
              <div className="text-xl font-bold text-white">
                {currentUser.following_count || 0}
              </div>
              <div className="text-sm text-white/90">Following</div>
            </button>
          </div>
        </div>
      </div>

      {/* Progress Card */}
      <div className="px-4 sm:px-6 max-w-4xl mx-auto w-full mt-6">
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Progress
            </span>
            <span className="text-3xl font-bold" style={{ color: '#0084FF' }}>
              {completionPercent}%
            </span>
          </div>
          <div className="h-4 bg-white rounded-full overflow-hidden border border-gray-200">
            <div 
              className="h-full rounded-full transition-all duration-500 ease-out shadow-sm"
              style={{ 
                width: `${completionPercent}%`,
                background: 'linear-gradient(to right, #0084FF, #00A3FF)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Gifts Section */}
      <div className="px-4 sm:px-6 flex-1 overflow-auto max-w-4xl mx-auto w-full">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mt-8 mb-4 sm:mb-6">
          Your Gifts
        </h3>

        {userPosts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <div className="mb-4 flex justify-center">
              <GiftIcon size={64} color="#D1D5DB" />
            </div>
            <p className="text-gray-500 text-base">
              No gifts yet. Start adding them!
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden shadow-md divide-y divide-gray-100">
            {userPosts.map((post) => {
              const StatusIconComponent = post.status === 'sent' ? CheckIcon : post.status === 'drafted' ? ArrowIcon : CircleIcon;
              const statusColor = post.status === 'sent' ? '#31A24C' : post.status === 'drafted' ? '#F7B928' : '#9CA3AF';
              
              return (
                <div 
                  key={post.id} 
                  onClick={() => onSelectPost(post)}
                  className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50 transition"
                >
                  {/* Gift Header */}
                  <div className="flex justify-between items-start gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-base sm:text-lg font-semibold text-gray-900 mb-2 break-words">
                        {post.what}
                      </div>
                      <div className="text-sm sm:text-base text-gray-600">
                        From {post.who}
                      </div>
                    </div>
                    {/* Clickable Status Icon */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPost(post);
                        onNavigate('status');
                      }}
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 hover:opacity-70 transition"
                      style={{ backgroundColor: `${statusColor}20` }}
                    >
                      <StatusIconComponent size={20} color={statusColor} />
                    </button>
                  </div>

                  {/* Image */}
                  {post.gift_image && (
                    <div className="w-full mb-4 rounded-xl overflow-hidden shadow-sm bg-gray-100">
                      <img 
                        src={post.gift_image.startsWith('http') ? post.gift_image : `${S3_BASE_URL}${post.gift_image}`}
                        alt={post.what}
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  )}

                  {/* Note */}
                  {post.note && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Thank You Note
                      </div>
                      <p className="text-sm sm:text-base leading-relaxed text-gray-900 italic break-words">
                        "{post.note}"
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Followers Modal */}
      {showFollowersModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[70vh] overflow-hidden shadow-xl">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Followers</h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFollowersModal(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
              {followersLoading ? (
                <div className="p-8 text-center text-gray-500">Loading...</div>
              ) : followers.length > 0 ? (
                followers.map(user => (
                  <div
                    key={user.id}
                    onClick={() => {
                      setShowFollowersModal(false);
                      handleNavigateToUser(user.username);
                    }}
                    className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                      {user.profile_picture ? (
                        <img 
                          src={user.profile_picture.startsWith('http') ? user.profile_picture : `${S3_BASE_URL}${user.profile_picture}`}
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 font-semibold">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {user.first_name || user.username}
                      </div>
                      <div className="text-sm text-gray-500">@{user.username}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">No followers yet</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[70vh] overflow-hidden shadow-xl">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Following</h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFollowingModal(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
              {followingLoading ? (
                <div className="p-8 text-center text-gray-500">Loading...</div>
              ) : following.length > 0 ? (
                following.map(user => (
                  <div
                    key={user.id}
                    onClick={() => {
                      setShowFollowingModal(false);
                      handleNavigateToUser(user.username);
                    }}
                    className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                      {user.profile_picture ? (
                        <img 
                          src={user.profile_picture.startsWith('http') ? user.profile_picture : `${S3_BASE_URL}${user.profile_picture}`}
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 font-semibold">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {user.first_name || user.username}
                      </div>
                      <div className="text-sm text-gray-500">@{user.username}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">Not following anyone yet</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;