import axios from "axios";

export const API_URL = "https://api.thankyounotes.today";

const api = axios.create({
  baseURL: API_URL
});

export const S3_BASE_URL = "https://django-01-tyn-s3.s3.us-west-1.amazonaws.com/media/"

// Request interceptor - add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 error and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        
        if (!refreshToken) {
          // No refresh token, logout
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/";
          return Promise.reject(error);
        }

        // Try to refresh the token
        const response = await axios.post(`${API_URL}/token/refresh/`, {
          refresh: refreshToken
        });

        const { access, refresh } = response.data;

        // Store new tokens
        localStorage.setItem("access_token", access);
        if (refresh) {
          // If ROTATE_REFRESH_TOKENS is True, backend sends new refresh token
          localStorage.setItem("refresh_token", refresh);
        }

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);

      } catch (refreshError) {
        // Refresh failed, logout
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth
export const register = (userData) => api.post("/register_user/", userData);
export const login = (credentials) => api.post("/token/", credentials);
export const getCurrentUser = () => api.get("/my_profile/");

// Posts (formerly gifts)
export const getHomeFeed = () => api.get("/home/");
export const getUserProfile = (username) => api.get(`/profile/${username}/`);
export const createPost = (postData) => api.post("/posts/create/", postData);
export const updatePost = (id, postData) => api.put(`/posts/update/${id}/`, postData);
export const deletePost = (id) => api.delete(`/posts/delete/${id}/`);

// Likes
export const likePost = (postId) => api.post(`/posts/like/${postId}/`);
export const likeComment = (commentId) => api.post(`/comments/${commentId}/like/`);
export const getPostLikes = (postId) => api.get(`/posts/${postId}/likes/`);

// Comments
export const createComment = (postId, text) => api.post(`/posts/${postId}/comments/create/`, { text });
export const updateComment = (commentId, text) => api.put(`/comments/${commentId}/update/`, { text });
export const deleteComment = (commentId) => api.delete(`/comments/${commentId}/delete/`);

// Follow
export const followUser = (username) => api.post(`/users/${username}/follow/`);

// Notifications
export const getNotifications = async () => {
  const response = await api.get('/notifications/');
  return response.data;
};

export const markNotificationRead = async (notificationId) => {
  const response = await api.post(`/notifications/${notificationId}/read/`);
  return response.data;
};

export const deleteNotification = async (notificationId) => {
  const response = await api.delete(`/notifications/${notificationId}/delete/`);
  return response.data;
};

export default api;