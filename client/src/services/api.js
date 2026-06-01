import axios from 'axios';

// Get backend URL from env, default to local development port
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// In-memory access token storage
let accessTokenMemory = null;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Crucial for receiving and sending httpOnly secure cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Getter and setter for in-memory access token
export const setAccessToken = (token) => {
  accessTokenMemory = token;
};

export const getAccessToken = () => {
  return accessTokenMemory;
};

// Request Interceptor: Attach bearer token to outgoing requests
api.interceptors.request.use(
  (config) => {
    if (accessTokenMemory) {
      config.headers.Authorization = `Bearer ${accessTokenMemory}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle auto-refreshing expired access tokens
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 Unauthorized and request hasn't been retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Avoid infinite loop if refreshing fails
      if (originalRequest.url === '/auth/refresh') {
        setAccessToken(null);
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue the request if token is currently being refreshed
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh the access token via httpOnly cookie endpoint
        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { accessToken } = response.data;
        setAccessToken(accessToken);

        // Update authorization headers on retry
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        setAccessToken(null);
        
        // Broadcast custom event so AuthContext can clean up state and redirect to login
        window.dispatchEvent(new Event('auth-session-expired'));
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
