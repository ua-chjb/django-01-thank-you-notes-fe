import { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import HomeFeed from './components/HomeFeed';
import GiftDetail from './components/GiftDetail';
import StatusToggle from './components/StatusToggle';
import Profile from './components/Profile';
import UserProfile from './components/UserProfile';
import AddGift from './components/AddGift';
import Notifications from './components/Notifications';
import { getHomeFeed, getCurrentUser, getNotifications } from './utils/api';
import { HomeIcon, PlusIcon, GiftIcon } from './components/Icons';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState('login');
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [viewingUsername, setViewingUsername] = useState(null);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const loadPosts = async () => {
    try {
      const response = await getHomeFeed();
      setPosts(response.data);
    } catch (err) {
      console.error('Error loading posts:', err);
    }
  };

  const loadCurrentUser = async () => {
    try {
      const response = await getCurrentUser();
      const userData = response.data;
      setCurrentUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Update profile picture in all posts authored by current user
      setPosts(prevPosts => 
        prevPosts.map(post => {
          // Update post author if it's current user
          const updatedPost = post.author.id === userData.id 
            ? { ...post, author: { ...post.author, profile_picture: userData.profile_picture } }
            : post;
          
          // Update comment authors if they're current user
          if (updatedPost.comments && updatedPost.comments.length > 0) {
            updatedPost.comments = updatedPost.comments.map(comment =>
              comment.author.id === userData.id
                ? { ...comment, author: { ...comment.author, profile_picture: userData.profile_picture } }
                : comment
            );
          }
          
          return updatedPost;
        })
      );
      
      // Update selectedPost if it's the current user's post
      setSelectedPost(prevSelected => {
        if (prevSelected && prevSelected.author.id === userData.id) {
          const updated = { ...prevSelected, author: { ...prevSelected.author, profile_picture: userData.profile_picture } };
          
          // Also update comments in selectedPost
          if (updated.comments && updated.comments.length > 0) {
            updated.comments = updated.comments.map(comment =>
              comment.author.id === userData.id
                ? { ...comment, author: { ...comment.author, profile_picture: userData.profile_picture } }
                : comment
            );
          }
          
          return updated;
        }
        return prevSelected;
      });
      
    } catch (err) {
      console.error('Error loading user:', err);
    }
  };

  const loadUnreadNotificationsCount = async () => {
    try {
      const data = await getNotifications();
      const unreadCount = data.unread_count || 0;
      setUnreadNotifications(unreadCount > 0 ? 1 : 0);
    } catch (err) {
      console.error('Error loading notifications count:', err);
    }
  };

  // Auto-refresh unread count every 30 seconds
  useEffect(() => {
    if (!isLoggedIn) return;

    const interval = setInterval(() => {
      loadUnreadNotificationsCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  useEffect(() => {
    if (selectedPost && posts.length > 0) {
      const updatedPost = posts.find(p => p.id === selectedPost.id);
      if (updatedPost) {
        setSelectedPost(updatedPost);
      }
    }
  }, [posts]);

  // authentication check
  useEffect(() => {
    const accessToken = localStorage.getItem("access_token")
    const refreshToken = localStorage.getItem("refresh_token")

    if (!accessToken || !refreshToken) {
      setIsLoggedIn(false);
      setCurrentView("login");
      setIsLoading(false);
      return
    }

    getCurrentUser()
      .then((response) => {
        const userData = response.data;
        setCurrentUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        setIsLoggedIn(true);
        setCurrentView("home");
        loadPosts();
        loadUnreadNotificationsCount();
      })
      .catch(() => {
        console.error("Auth check failed:", error);
        setIsLoggedIn(false);
        setCurrentView("login");
      })
      .finally(() => {
        setIsLoading(false);
      })
  }, []);

  const handleNavigateToUserProfile = (username) => {
    // If viewing own profile, go to the "profile" view instead
    if (currentUser && username === currentUser.username) {
      setCurrentView('profile');
    } else {
      setViewingUsername(username);
      setCurrentView('userProfile');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('profile_picture_preview');
    setIsLoggedIn(false);
    setCurrentView('login');
    setPosts([]);
    setCurrentUser(null);
    setUnreadNotifications(0);
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setCurrentView('home');
    loadPosts();
    loadCurrentUser();
    loadUnreadNotificationsCount();
  };

  const handleRegisterSuccess = () => {
    setIsLoggedIn(true);
    setCurrentView('home');
    loadPosts();
    loadCurrentUser();
    loadUnreadNotificationsCount();
  };

  // Login/Register/Verify views
  if (!isLoggedIn) {
    if (currentView === 'register') {
      return (
        <RegisterForm 
          onRegisterSuccess={handleRegisterSuccess}
          onSwitchToLogin={() => setCurrentView('login')}
        />
      );
    }

    return (
      <LoginForm 
        onLoginSuccess={handleLoginSuccess}
        onSwitchToRegister={() => setCurrentView('register')}
      />
    );
  }
  // Main app views (when logged in)
  return (
    <div className="relative">
      {currentView === 'home' && (
        <HomeFeed 
          posts={posts}
          currentUser={currentUser}
          onSelectPost={(post) => { setSelectedPost(post); setCurrentView('detail'); }}
          onNavigate={setCurrentView}
          onUpdate={loadPosts}
          onNavigateToUserProfile={handleNavigateToUserProfile}
        />
      )}

      {currentView === 'add' && (
        <AddGift 
          onBack={() => setCurrentView('home')}
          onSuccess={() => {
            loadPosts();
            setCurrentView('home');
          }}
        />
      )}

      {currentView === 'profile' && (
        <Profile 
          posts={posts}
          currentUser={currentUser}
          onLogout={handleLogout}
          onNavigate={setCurrentView}
          onSelectPost={(post) => { setSelectedPost(post); setCurrentView('detail'); }}
          onUserUpdate={loadCurrentUser}
          onNavigateToUserProfile={handleNavigateToUserProfile}
        />
      )}

      {currentView === 'userProfile' && viewingUsername && (
        <UserProfile 
          username={viewingUsername}
          onBack={() => {
            setViewingUsername(null);
            setCurrentView('home');
          }}
          onSelectPost={(post) => {
            setSelectedPost(post);
            setCurrentView('detail');
          }}
          onNavigateToUser={(username) => {
            setViewingUsername(username);
          }}
        />
      )}

      {currentView === 'detail' && (
        <GiftDetail 
          gift={selectedPost}
          currentUser={currentUser}
          onBack={() => setCurrentView('home')}
          onStatusClick={() => setCurrentView('status')}
          onUpdate={loadPosts}
        />
      )}

      {currentView === 'status' && (
        <StatusToggle 
          gift={selectedPost}
          onBack={() => setCurrentView('detail')}
          onUpdate={loadPosts}
        />
      )}

	  {currentView == 'notifications' && (
		<Notifications
		  onNavigate={setCurrentView}
		  onSelectPost={async (postPreview) => {
			const fullPost = posts.find(p => p.id === postPreview.id)
			if (fullPost) {
			  setSelectedPost(fullPost);
			  setCurrentView('detail');
			} else {
			  await loadPosts();
			  const reloadedPost = posts.find(p => p.id === postPreview.id);
			  if (reloadedPost) {
				setSelectedPost(reloadedPost);
				setCurrentView('detail');
			  }
			}
		  }}
		  onNavigateToUserProfile={handleNavigateToUserProfile}
		/>
	  )}

      {/* Bottom Navigation (only show on main views) */}
      {['home', 'profile', 'userProfile', 'notifications'].includes(currentView) && (
		<div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-8 flex justify-around items-center z-50">          <button 
            onClick={() => setCurrentView('home')}
            className={`flex flex-col items-center gap-1 transition ${
              currentView === 'home' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <HomeIcon size={28} color="currentColor" />
          </button>

          <button 
            onClick={() => setCurrentView('add')}
            className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-700 transition"
          >
            <PlusIcon size={28} color="currentColor" />
          </button>

          {/* Notifications */}
          <button 
            onClick={() => {
              setCurrentView('notifications');
              setUnreadNotifications(0);
            }}
            className={`flex flex-col items-center gap-1 transition relative ${
              currentView === 'notifications' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadNotifications > 0 && (
              <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" style={{ backgroundColor: '#FF385C' }} />
            )}
          </button>

          <button 
            onClick={() => setCurrentView('profile')}
            className={`flex flex-col items-center gap-1 transition ${
              currentView === 'profile' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <GiftIcon size={28} color="currentColor" />
          </button>
        </div>
      )}
    </div>
  );
}

export default App;