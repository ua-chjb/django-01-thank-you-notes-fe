import { useState, useEffect, useRef } from 'react';
import { getUserProfile, followUser } from '../utils/api';
import { BackIcon, UserIcon, CheckIcon, ArrowIcon, CircleIcon, MoreIcon } from './Icons';

function UserProfile({ username, onBack, onSelectPost, onNavigateToUser }) {
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [showUnfollowMenu, setShowUnfollowMenu] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getUserProfile(username);
        setProfileData(response.data);
        setIsFollowing(response.data.is_following);
        setFollowerCount(response.data.follower_count);
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [username]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUnfollowMenu(false);
      }
    };

    if (showUnfollowMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUnfollowMenu]);

  const handleFollow = async () => {
    setIsFollowLoading(true);
    try {
      await followUser(username);
      setIsFollowing(true);
      setFollowerCount(prev => prev + 1);
    } catch (err) {
      console.error('Error following user:', err);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    setShowUnfollowMenu(false);
    setIsFollowLoading(true);
    try {
      await followUser(username);
      setIsFollowing(false);
      setFollowerCount(prev => prev - 1);
    } catch (err) {
      console.error('Error unfollowing user:', err);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const loadFollowers = async () => {
    setFollowersLoading(true);
    try {
      const response = await fetch(`${API_URL}/users/${username}/followers/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      const data = await response.json();
      setProfileData(prev => ({ ...prev, followers: data.followers || data }));
    } catch (err) {
      console.error('Error loading followers:', err);
    } finally {
      setFollowersLoading(false);
    }
  };

  const loadFollowing = async () => {
    setFollowingLoading(true);
    try {
      const response = await fetch(`${API_URL}/users/${username}/following/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      const data = await response.json();
      setProfileData(prev => ({ ...prev, following: data.following || data }));
    } catch (err) {
      console.error('Error loading following:', err);
    } finally {
      setFollowingLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 pb-24">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <BackIcon size={24} color="#374151" />
          </button>
          <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
        </div>
        <div className="p-8 text-center text-red-600">{error}</div>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    if (status === 'sent') return { Icon: CheckIcon, color: '#31A24C' };
    if (status === 'drafted') return { Icon: ArrowIcon, color: '#F7B928' };
    return { Icon: CircleIcon, color: '#9CA3AF' };
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-24 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition"
        >
          <BackIcon size={24} color="#374151" />
        </button>
        <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
      </div>

      {/* Profile Header with Gradient */}
      <div className="bg-gradient-to-br from-christmas-light to-christmas-dark px-5 py-12 sm:py-20 relative flex-shrink-0">
        <div className="text-center max-w-md mx-auto">
          {/* Profile Picture */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/90 rounded-full mx-auto mb-4 flex items-center justify-center shadow-xl overflow-hidden">
            {profileData.profile_picture ? (
              <img 
                src={profileData.profile_picture.startsWith('http') 
                  ? profileData.profile_picture 
                  : `${API_URL}${profileData.profile_picture}`
                }
                alt={profileData.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon size={40} color="#6B7280" />
            )}
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 drop-shadow-sm">
            {profileData.first_name || profileData.username}
          </h2>
          <p className="text-white/90 text-sm sm:text-base mb-4">
            @{profileData.username}
          </p>

          {/* Stats */}
          <div className="flex gap-6 mb-6 justify-center">
            <button 
              onClick={() => {
                setShowFollowersModal(true);
                loadFollowers();
              }}
              className="text-center hover:opacity-70 transition"
            >
              <div className="text-xl font-bold text-white">
                {followerCount || 0}
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
                {profileData.following_count || 0}
              </div>
              <div className="text-sm text-white/90">Following</div>
            </button>
          </div>

          {/* Follow/Following Button - Below Stats */}
          <div className="flex items-center justify-center gap-2">
            {!isFollowing ? (
              <button
                onClick={handleFollow}
                disabled={isFollowLoading}
                className="w-32 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold text-white hover:bg-white/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFollowLoading ? '...' : 'Follow'}
              </button>
            ) : (
              <>
                <button
                  disabled={isFollowLoading}
                  className="w-32 bg-gray-200 px-4 py-2 rounded-full text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ color: '#0084FF' }}
                >
                  Following
                </button>
                <div className="relative" ref={menuRef}>
                  <button 
                    onClick={() => setShowUnfollowMenu(!showUnfollowMenu)}
                    className="p-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full transition"
                  >
                    <MoreIcon size={20} color="white" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showUnfollowMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                      <button
                        onClick={handleUnfollow}
                        disabled={isFollowLoading}
                        className="w-full px-4 py-3 text-left text-gray-900 hover:bg-gray-50 transition flex items-center gap-2 font-medium text-sm disabled:opacity-50"
                      >
                        Unfollow @{profileData.username}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div className="px-4 sm:px-6 flex-1 overflow-auto max-w-4xl mx-auto w-full">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mt-8 mb-4 sm:mb-6">
          {profileData.first_name || profileData.username}'s Gifts
        </h3>

        {profileData.posts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <p className="text-gray-500 text-base">
              No posts yet
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden shadow-md divide-y divide-gray-100">
            {profileData.posts.map((post) => {
              const statusInfo = getStatusIcon(post.status);
              const StatusIconComponent = statusInfo.Icon;
              
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
                    <div 
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${statusInfo.color}20` }}
                    >
                      <StatusIconComponent size={20} color={statusInfo.color} />
                    </div>
                  </div>

                  {/* Image */}
                  {post.gift_image && (
                    <div className="w-full mb-4 rounded-xl overflow-hidden shadow-sm bg-gray-100">
                      <img 
                        src={post.gift_image.startsWith('http') ? post.gift_image : `${API_URL}${post.gift_image}`}
                        alt={post.what}
                        className="w-full h-auto object-cover"
                      />
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
              ) : profileData?.followers && profileData.followers.length > 0 ? (
                profileData.followers.map(user => (
                  <div
                    key={user.id}
                    onClick={() => {
                      setShowFollowersModal(false);
                      onNavigateToUser(user.username);
                    }}
                    className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                      {user.profile_picture ? (
                        <img 
                          src={user.profile_picture.startsWith('http') ? user.profile_picture : `${API_URL}${user.profile_picture}`}
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
              ) : profileData?.following && profileData.following.length > 0 ? (
                profileData.following.map(user => (
                  <div
                    key={user.id}
                    onClick={() => {
                      setShowFollowingModal(false);
                      onNavigateToUser(user.username);
                    }}
                    className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                      {user.profile_picture ? (
                        <img 
                          src={user.profile_picture.startsWith('http') ? user.profile_picture : `${API_URL}${user.profile_picture}`}
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

export default UserProfile;